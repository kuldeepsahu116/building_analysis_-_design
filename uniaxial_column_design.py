import numpy as np
import matplotlib.pyplot as plt


# ============================================================
# STEEL STRESS
# ============================================================
def steel_stress(strain, fy, Es):
 
    # Compression = positive
    # Tension    = negative
    # Design yield stress = fy / 1.15 = 0.87 * fy
  
    fyd = 0.87 * fy
    stress = Es * strain

    # Limit to design yield stress
    stress = max(-fyd, min(fyd, stress))

    return stress

# ============================================================
# CONCRETE STRESS BLOCK
# ============================================================

def concrete_stress_block_inside(xu, b, fck):
    # xu <= D

    Cc = 0.36 * fck * b * xu
    yc = 0.42 * xu

    return Cc, yc

def concrete_stress_block_outside(xu, b, D, fck):

    # SP-16 Clause 3.2.2
    #     xu > D
    
    k = xu / D

    # SP-16 coefficient C1
    C1 = (0.446* (1.0 - (4.0 / 21.0) * (4.0 / (7.0 * k - 3.0)) ** 2))

    # SP-16 coefficient C2
    C2 = ((0.5 - (8.0 / 49.0) * (4.0 / (7.0 * k - 3.0)) ** 2)
         /(1.0 - (4.0 / 21.0) * (4.0 / (7.0 * k - 3.0)) ** 2))


    Cc = C1 * fck * b * D
    yc = C2 * D

    return Cc, yc, C1, C2


# ============================================================
# CONCRETE RESULTANT
# ============================================================

def concrete_resultant(xu, b, D, fck):

    if xu <= D:

        Cc, yc = concrete_stress_block_inside(xu, b, fck)

        return Cc, yc

    else:

        Cc, yc, C1, C2 = concrete_stress_block_outside(xu, b, D, fck)

        return Cc, yc


# ============================================================
# STRAIN IN STEEL
# ============================================================
def steel_strain(y, xu, D):
    
    # CASE 1: NEUTRAL AXIS INSIDE SECTION
    if xu < D:

        eps_max = 0.0035
        strain = eps_max * (xu - y) / xu

        return strain

    # CASE 2: NEUTRAL AXIS OUTSIDE / AT SECTION

    # (xu-D)/xu = eps_min / eps_max
    # eps_max = 0.0035 - 0.75 * eps_min
    # by solving both equations
    # eps_max = 0.0035 / (1 - (0.75 * (xu - y) / xu))
    
    else:

        ratio = (xu - D) / xu
        eps_max = 0.0035 / (1.0 + 0.75 * ratio)
        strain = eps_max * (xu - y) / xu

        return strain


# ============================================================
# SECTION CAPACITY
# ============================================================

def section_capacity(xu, Ast, b, D, fck, fy, Es, d_dash):

    # Concrete
    Cc, yc = concrete_resultant(xu, b, D, fck)

    # Equal reinforcement on two opposite faces
    As_face = Ast / 2.0

    # Reinforcement layer locations measured from highly compressed face
    steel_layers = [
        (d_dash, As_face),
        (D - d_dash, As_face)
    ]

    # Steel
    steel_force_total = 0.0
    steel_moment_total = 0.0

    steel_data = []

    for y, As in steel_layers:

        eps = steel_strain(y, xu, D)

        fs = steel_stress(eps, fy, Es)

        Fs = fs * As

        steel_force_total += Fs
        steel_moment_total += Fs * (D/2 - y)

        steel_data.append({
            "y": y,
            "As": As,
            "strain": eps,
            "stress": fs,
            "force": Fs })

    # TOTAL AXIAL FORCE
    Pu = Cc + steel_force_total

    # TOTAL MOMENT ABOUT COMPRESSION FACE
    Mu = Cc * (D/2 - yc) + steel_moment_total

    return Pu, Mu


# ============================================================
# GENERATE INTERACTION CURVE
# ============================================================
def generate_interaction_curve(Ast, b, D, fck, fy, Es, d_dash):
    n_inside = 20
    n_outside = 20

    xu_inside = np.linspace(1.0, D, n_inside)
    xu_outside = np.geomspace(D, D * 10000.0, n_outside)

    xu_values = np.concatenate([xu_inside, xu_outside[1:]])

    P_values = []
    M_values = []
    Xu_values = []

    # Calculate curve

    for xu in xu_values:

        Pu, Mu = section_capacity(xu, Ast, b, D, fck, fy, Es, d_dash)

        Pu_kN = Pu/1000.0
        Mu_kNm = abs(Mu) / 1e6

        if Pu_kN >= 0:
            P_values.append(Pu_kN)      # kN
            M_values.append(Mu_kNm)     # kNm
            Xu_values.append(xu)

    fc_axial = 0.446 * fck
    Cc_axial = fc_axial * b * D
    fs = steel_stress(0.002, fy, Es)
    Fs_axial = fs * Ast

    Pu_axial = Cc_axial + Fs_axial

    # Add pure axial point
    P_values.append(Pu_axial/1000.0)
    M_values.append(0.0)

    return (np.array(P_values), np.array(M_values), np.array(Xu_values))

# ============================================================
# FIND Mu AT REQUIRED Pu
# ============================================================
def find_Mu_at_Pu(Pu_required, P_curve, M_curve):

    Mu_values = []

    # Find every location where the curve crosses the required Pu
    for i in range(len(P_curve) - 1):

        P1 = P_curve[i]
        P2 = P_curve[i + 1]

        M1 = M_curve[i]
        M2 = M_curve[i + 1]

        # Exact point
        if P1 == Pu_required:
            Mu_values.append(M1)

        # Crossing between two points
        elif ((P1 - Pu_required) * (P2 - Pu_required) < 0):

            ratio = (Pu_required - P1 ) / (P2 - P1)

            M_interpolated = (M1 + ratio * (M2 - M1))

            Mu_values.append(M_interpolated)


    # No intersection
    if len(Mu_values) == 0:
        Mu_values.append(0.0)

    # If more than one intersection exists, take the maximum available moment capacity.
    return max(Mu_values)

def get_Ast(b, D, fck, fy, Es, d_dash, Pu_required, Mu_required, Ast_min_percent, Ast_max_percent, Mu_tolarance):

    low = Ast_min_percent
    high = Ast_max_percent

    # FIRST TRY: MINIMUM Ast
    Ast_percent = low
    Ast = (Ast_percent / 100.0) * b * D

    P_curve, M_curve, Xu_curve = generate_interaction_curve(Ast, b, D, fck, fy, Es, d_dash)

    Mu_capacity = find_Mu_at_Pu(Pu_required,P_curve,M_curve)

    # Minimum reinforcement already satisfies requirement
    if Mu_required <= Mu_capacity:
        return Ast_percent, Ast, Mu_capacity, P_curve, M_curve


    # SECOND TRY: MAXIMUM Ast
    Ast_percent = high
    Ast = (Ast_percent / 100.0) * b * D

    P_curve, M_curve, Xu_curve = generate_interaction_curve(Ast, b, D, fck, fy, Es, d_dash)

    Mu_capacity = find_Mu_at_Pu(Pu_required, P_curve, M_curve)

    # Even maximum reinforcement cannot satisfy requirement
    if Mu_required > Mu_capacity:
        raise ValueError(
            "Required moment capacity cannot be achieved "
            f"within maximum Ast limits of {Ast_max_percent:.2f}%."
        )
 


    while abs(Mu_capacity - Mu_required) > Mu_tolarance:

        mid = (low + high) / 2.0

        Ast_percent = mid
        Ast = Ast_percent*b*D/100.0

        P_curve, M_curve, Xu_curve = generate_interaction_curve(Ast, b, D, fck, fy, Es, d_dash)

        Mu_capacity = find_Mu_at_Pu(Pu_required, P_curve, M_curve)

        # Capacity is too low, Need more reinforcement
        if Mu_capacity < Mu_required:
            low = mid
            continue

        # Capacity is sufficient, Try less reinforcement
        else:
            high = mid

    return Ast_percent, Ast, Mu_capacity, P_curve, M_curve



if __name__ == "__main__":

    # Column dimensions
    b = 300.0       # mm
    D = 500.0       # mm

    # Material
    fck = 20.0      # MPa
    fy = 500.0      # MPa
    Es = 200000.0   # MPa

    # Distance of reinforcement centroid from nearest face
    d_dash = 50.0   # mm

    # DESIGN LOADS
    Pu_required = 1000.0      # kN
    Mu_required = 150.0       # kNm

    # REINFORCEMENT LIMITS
    Ast_min_percent = 0.8
    Ast_max_percent = 4.0   # limit is 6% but in IS code 4% is suggested 

    # Small capacity margin
    Mu_tolarance = 1.0           # kNm


    Ast_percent, Ast, Mu_capacity, P_curve, M_curve = get_Ast(b, D, fck, fy, Es, d_dash, Pu_required, Mu_required, Ast_min_percent, Ast_max_percent, Mu_tolarance)


    # CALCULATE RESULTS
    Ag = b * D
    As_face = Ast / 2.0

    Mu_difference = Mu_capacity - Mu_required


    # ============================================================
    # PRINT RESULTS
    # ============================================================

    print("\n==============================================")
    print("          COLUMN INTERACTION ANALYSIS")
    print("==============================================")

    print(f"Section             : {b:.0f} × {D:.0f} mm")
    print(f"Gross area          : {Ag:.0f} mm²")

    print("----------------------------------------------")

    print(f"Concrete            : M{fck:.0f}")
    print(f"Steel               : Fe{fy:.0f}")

    print("----------------------------------------------")

    print(f"Required Pu         : {Pu_required:.2f} kN")
    print(f"Required Mu         : {Mu_required:.2f} kNm")

    print("----------------------------------------------")

    print(f"Ast percentage      : {Ast_percent:.3f} %")
    print(f"Total Ast           : {Ast:.2f} mm²")
    print(f"Steel per face      : {As_face:.2f} mm²")

    print("----------------------------------------------")

    print(f"Mu capacity         : {Mu_capacity:.2f} kNm")
    print(f"Mu difference       : {Mu_difference:+.2f} kNm")
    print(f"Mu tolerance        : {Mu_tolarance:.2f} kNm")

    if abs(Mu_difference) <= Mu_tolarance:
        print("Design status       : ECONOMICAL")
    elif Mu_capacity >= Mu_required:
        print("Design status       : SAFE")
    else:
        print("Design status       : NOT SAFE(need to increase the section)")

    print("----------------------------------------------")

    print(f"Ast limits          : "
          f"{Ast_min_percent:.2f}% - {Ast_max_percent:.2f}%")

    print("==============================================")


    # ============================================================
    # PLOT INTERACTION CURVE
    # ============================================================

    plt.figure(figsize=(5, 7))

    # Interaction curve
    plt.plot(
        M_curve,
        P_curve,
        linewidth=2,
        label=f"Interaction curve (Ast = {Ast_percent:.3f}%)"
    )

    # Required load point
    plt.scatter(
        Mu_required,
        Pu_required,
        s=80,
        zorder=5,
        label="Required load"
    )

    # Capacity point at required Pu
    plt.scatter(
        Mu_capacity,
        Pu_required,
        s=80,
        zorder=5,
        label="Capacity at required Pu"
    )

    # Horizontal line showing required Pu
    plt.axhline(
        Pu_required,
        linestyle="--",
        linewidth=1
    )

    # Vertical line showing required Mu
    plt.axvline(
        Mu_required,
        linestyle="--",
        linewidth=1
    )

    # Labels
    plt.xlabel("Moment Capacity, Mu (kNm)")
    plt.ylabel("Axial Capacity, Pu (kN)")

    plt.title(
        f"P-M Interaction Curve\n"
        f"{b:.0f} × {D:.0f} mm | "
        f"M{fck:.0f} | Fe{fy:.0f} | "
        f"Ast = {Ast_percent:.3f}%"
    )

    plt.legend()
    plt.grid(True)

    plt.tight_layout()
    plt.show()

