import numpy as np
import matplotlib.pyplot as plt

# ============================================================
# IS 456: CLAUSE 39.6 biaxial interaction exponent
# ============================================================
def get_alpha_n(Pu, Puz):

    Pu_Puz = abs(Pu / Puz)

    if Pu_Puz <= 0.2:
        alpha_n = 1.0

    elif Pu_Puz >= 0.8:
        alpha_n = 2.0

    else:
        alpha_n = 1.0 + ((Pu_Puz - 0.2) / (0.8 - 0.2))

    return alpha_n

# ============================================================
# Pure axial capacity for clause 39.6
# ============================================================
def get_Puz(b, D, fck, fy, Ast):

    Ag = b * D
    Ac = Ag - Ast

    Puz = (0.45 * fck * Ac + 0.75 * fy * Ast)

    return Puz/1000

# ============================================================
# get steel layers
# ============================================================
def get_steel_layers(Ast, D, d_dash):
    # Assume 20 bars as per assumption in sp 16 to make the interaction curve 
    Ast_bar = Ast / 20
    # Reinforcement layer locations measured from highly compressed face
    steel_layers = [
        (d_dash, Ast_bar * 6),
        (d_dash + (((D - 2*d_dash)/5)*1), Ast_bar * 2),
        (d_dash + (((D - 2*d_dash)/5)*2), Ast_bar * 2),
        (d_dash + (((D - 2*d_dash)/5)*3), Ast_bar * 2),
        (d_dash + (((D - 2*d_dash)/5)*4), Ast_bar * 2),
        (d_dash + (((D - 2*d_dash)/5)*5), Ast_bar * 6)]

    return steel_layers


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
# SECTION CAPACITY
# ============================================================

def section_capacity(xu, Ast, b, D, fck, fy, Es, steel_layers):

    # Concrete
    Cc, yc = concrete_resultant(xu, b, D, fck)

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

    # Reinforcement layers
    steel_layers = get_steel_layers(Ast, D, d_dash)

    n_inside = 21
    n_outside = 21

    xu_inside = np.linspace(0.1, D, n_inside)
    xu_outside = np.geomspace(D, D * 10000.0, n_outside)

    xu_values = np.concatenate([xu_inside, xu_outside[1:]])

    P_values = []
    M_values = []
    Xu_values = []

    # Calculate curve

    for xu in xu_values:

        Pu, Mu = section_capacity(xu, Ast, b, D, fck, fy, Es, steel_layers)

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
        Mu_values.append(0.1)

    # If more than one intersection exists, take the maximum available moment capacity.
    return max(Mu_values)

# ============================================================
# IS 456 CLAUSE 39.6
# BIAXIAL INTERACTION CHECK
# ============================================================

def biaxial_interaction(Pu_required, Mux_required, Muy_required, Mux1, Muy1, Puz):

    alpha_n = get_alpha_n(Pu_required, Puz)

    x_ratio = Mux_required / Mux1
    y_ratio = Muy_required / Muy1

    interaction = (
        (x_ratio ** alpha_n)
        + (y_ratio ** alpha_n)
    )

    return interaction, alpha_n


# ============================================================
# Get required Ast for column design
# ============================================================
def get_Ast_biaxial(b, D, fck, fy, Es, d_dash, Pu_required, Mux_required, Muy_required, Ast_min_percent, Ast_max_percent, interaction_tolerance):

    low = Ast_min_percent
    high = Ast_max_percent

    # FIRST TRY: MINIMUM Ast
    Ast_percent = low
    Ast = (Ast_percent / 100.0) * b * D

    # X-X DIRECTION
    P_curve_x, M_curve_x, Xu_curve_x = generate_interaction_curve(Ast, b, D, fck, fy, Es, d_dash)

    Mu_x1 = find_Mu_at_Pu(Pu_required, P_curve_x, M_curve_x)

    # Y-Y DIRECTION
    P_curve_y, M_curve_y, Xu_curve_y = generate_interaction_curve(Ast, D, b, fck, fy, Es, d_dash)

    Mu_y1 = find_Mu_at_Pu(Pu_required, P_curve_y, M_curve_y)

    # Puz 
    Puz = get_Puz(b, D, fck, fy, Ast)

    # Biaxial interaction
    interaction, alpha_n = biaxial_interaction(Pu_required, Mux_required, Muy_required, Mu_x1, Mu_y1, Puz)

    # Minimum reinforcement already satisfies requirement
    if interaction <= 1.0:
        return Ast_percent, Ast, Mu_x1, Mu_y1, Puz, interaction, alpha_n, P_curve_x, M_curve_x, P_curve_y, M_curve_y


    # SECOND TRY: MAXIMUM Ast
    Ast_percent = high
    Ast = (Ast_percent / 100.0) * b * D

    # X-X DIRECTION
    P_curve_x, M_curve_x, Xu_curve_x = generate_interaction_curve(Ast, b, D, fck, fy, Es, d_dash)

    Mu_x1 = find_Mu_at_Pu(Pu_required, P_curve_x, M_curve_x)

    # Y-Y DIRECTION
    P_curve_y, M_curve_y, Xu_curve_y = generate_interaction_curve(Ast, D, b, fck, fy, Es, d_dash)

    Mu_y1 = find_Mu_at_Pu(Pu_required, P_curve_y, M_curve_y)

    # Puz 
    Puz = get_Puz(b, D, fck, fy, Ast)

    # Biaxial interaction
    interaction, alpha_n = biaxial_interaction(Pu_required, Mux_required, Muy_required, Mu_x1, Mu_y1, Puz)

    # Even maximum reinforcement cannot satisfy requirement
    if interaction > 1.0:
        raise ValueError(
            "Required moment capacity cannot be achieved "
            f"within maximum Ast limits of {Ast_max_percent:.2f}%."
        )



    while abs(interaction + (interaction_tolerance/2) - 1.0) > (interaction_tolerance/2) :

        mid = (low + high) / 2.0

        Ast_percent = mid
        Ast = Ast_percent*b*D/100.0

        # X-X DIRECTION
        P_curve_x, M_curve_x, Xu_curve_x = generate_interaction_curve(Ast, b, D, fck, fy, Es, d_dash)

        Mu_x1 = find_Mu_at_Pu(Pu_required, P_curve_x, M_curve_x)

        # Y-Y DIRECTION
        P_curve_y, M_curve_y, Xu_curve_y = generate_interaction_curve(Ast, D, b, fck, fy, Es, d_dash)

        Mu_y1 = find_Mu_at_Pu(Pu_required, P_curve_y, M_curve_y)

        # Puz 
        Puz = get_Puz(b, D, fck, fy, Ast)

        # Biaxial interaction
        interaction, alpha_n = biaxial_interaction(Pu_required, Mux_required, Muy_required, Mu_x1, Mu_y1, Puz)

        # Capacity is too low, Need more reinforcement
        if interaction > 1.0:
            low = mid
            continue

        # Capacity is sufficient, Try less reinforcement
        else:
            high = mid

    return Ast_percent, Ast, Mu_x1, Mu_y1, Puz, interaction, alpha_n,  P_curve_x, M_curve_x, P_curve_y, M_curve_y

def generate_3d_interaction_surface(Ast, b, D, fck, fy, Es, d_dash, num_points=30):
    # 1. Get 1D P-M curve along X-X to extract representative Pu values
    P_curve_x, M_curve_x, _ = generate_interaction_curve(Ast, b, D, fck, fy, Es, d_dash)
    
    # 2. Sample Pu levels across the capacity range
    Pu_levels = np.linspace(min(P_curve_x) + 0.1, max(P_curve_x) - 0.1, num_points)
    angles = np.linspace(0, np.pi / 2, num_points) # 1st quadrant (Mx >= 0, My >= 0)
    
    P_mesh, Angle_mesh = np.meshgrid(Pu_levels, angles)
    Mx_mesh = np.zeros_like(P_mesh)
    My_mesh = np.zeros_like(P_mesh)
    
    # 3. For each Pu, calculate Mux1, Muy1 and generate the Mx-My contour
    for i, P_val in enumerate(Pu_levels):
        # Generate directional interaction curves for the current Ast
        P_x, M_x, _ = generate_interaction_curve(Ast, b, D, fck, fy, Es, d_dash)
        P_y, M_y, _ = generate_interaction_curve(Ast, D, b, fck, fy, Es, d_dash)
        
        Mux1 = find_Mu_at_Pu(P_val, P_x, M_x)
        Muy1 = find_Mu_at_Pu(P_val, P_y, M_y)
        Puz = get_Puz(b, D, fck, fy, Ast)
        
        alpha_n = get_alpha_n(P_val, Puz)
        
        # Calculate Mx and My using superellipse equations
        for j, theta in enumerate(angles):
            Mx_mesh[j, i] = Mux1 * (np.cos(theta)) ** (2.0 / alpha_n)
            My_mesh[j, i] = Muy1 * (np.sin(theta)) ** (2.0 / alpha_n)
            
    return P_mesh, Mx_mesh, My_mesh



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
    Pu_required = 2000.0      # kN
    Mux_required = 120.0       # kNm
    Muy_required = 80.0       # kNm

    # REINFORCEMENT LIMITS
    Ast_min_percent = 0.8
    Ast_max_percent = 4.0   # limit is 6% but in IS code 4% is suggested 

    # Small capacity margin
    interaction_tolerance = 0.01     

    Ag = b*D     


    # BIAXIAL DESIGN
    Ast_percent, Ast, Mux1, Muy1, Puz, interaction, alpha_n, P_curve_x, M_curve_x, P_curve_y, M_curve_y = get_Ast_biaxial(
        b, D, fck, fy, Es, d_dash, Pu_required, Mux_required, Muy_required, Ast_min_percent, Ast_max_percent,interaction_tolerance)


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
    print(f"Required Mux        : {Mux_required:.2f} kNm")
    print(f"Required Muy        : {Muy_required:.2f} kNm")

    print("----------------------------------------------")

    print(f"Ast percentage      : {Ast_percent:.3f} %")
    print(f"Total Ast           : {Ast:.2f} mm²")

    print("----------------------------------------------")

    print(f"Mux1 capacity       : {Mux1:.2f} kNm")
    print(f"Muy1 capacity       : {Muy1:.2f} kNm")

    print("----------------------------------------------")

    print(f"Puz                 : {Puz:.2f} kN")
    print(f"Pu/Puz              : {float(Pu_required/Puz):.3f}")

    print(f"Interaction value   : {interaction:.4f}")
    print(f"Alpha n   : {alpha_n:.4f}")

    if interaction <= 1.0:
        if interaction >= 1.0 - interaction_tolerance:
            print("Design status       : SAFE AND EONOMICAL")
        else:
            print("Design status       : SAFE")
            print("Warning: Minimum reinforcement governs. "
            "Section has excess capacity; consider reducing section size.")
    else:
        print("Design status       : NOT SAFE")

    print("==============================================")

    # ============================================================
    # COMBINED 2D AND 3D PLOTS SIMULTANEOUSLY
    # ============================================================

    # Create figure with 2 subplots side-by-side
    fig = plt.figure(figsize=(15, 7))

    # ============================================================
    # PLOT Mx - My BIAXIAL INTERACTION CONTOUR AT REQUIRED Pu
    # ============================================================
    ax1 = fig.add_subplot(1, 2, 1)

    alpha_n = get_alpha_n(Pu_required, Puz)

    # Parametric curve generation for Superellipse boundary:
    # (Mx / Mux1)^alpha_n + (My / Muy1)^alpha_n = 1
    theta = np.linspace(0, np.pi / 2, 300)
    Mx_contour = Mux1 * (np.cos(theta)) ** (2.0 / alpha_n)
    My_contour = Muy1 * (np.sin(theta)) ** (2.0 / alpha_n)

    

    # 1. Biaxial Interaction Boundary
    ax1.plot(
        Mx_contour, 
        My_contour, 
        color='blue', 
        linewidth=2.5, 
        label=f"Biaxial Boundary ($P_u = {Pu_required:.0f}$ kN, $\\alpha_n = {alpha_n:.2f}$)"
    )

    # 2. Required Load Point
    ax1.scatter(
        Mux_required, 
        Muy_required, 
        color='red', 
        s=100, 
        zorder=5, 
        label=f"Required Point ({Mux_required:.1f}, {Muy_required:.1f}) kNm"
    )

    # 3. Intercept points on Axes (Mux1 & Muy1)
    ax1.scatter([Mux1, 0], [0, Muy1], color='navy', s=60, zorder=4)
    ax1.annotate(f"$M_{{ux1}}$ = {Mux1:.1f} kNm", (Mux1, 0), xytext=(-10, 12), textcoords="offset points", ha='right', fontweight='bold')
    ax1.annotate(f"$M_{{uy1}}$ = {Muy1:.1f} kNm", (0, Muy1), xytext=(12, -15), textcoords="offset points", ha='left', fontweight='bold')

    # 4. Reference Guidelines
    ax1.axvline(Mux_required, color='gray', linestyle=':', alpha=0.7)
    ax1.axhline(Muy_required, color='gray', linestyle=':', alpha=0.7)

    # Axis Formatting & Labels
    ax1.set_xlabel("Bending Moment $M_{ux}$ (kNm)", fontsize=11)
    ax1.set_ylabel("Bending Moment $M_{uy}$ (kNm)", fontsize=11)
    ax1.set_title(f"2D $M_x - M_y$ Contour at $P_u = {Pu_required:.0f}$ kN", fontsize=12, pad=12)

    ax1.set_xlim(0, max(Mux1, Mux_required) * 1.15)
    ax1.set_ylim(0, max(Muy1, Muy_required) * 1.15)
    ax1.grid(True, linestyle='--', alpha=0.6)
    ax1.legend(loc='upper right', frameon=True)


    # ============================================================
    # PLOT 3D P-Mx-My INTERACTION SURFACE
    # ============================================================
    ax2 = fig.add_subplot(1, 2, 2, projection='3d')
    
    # Generate 3D surface mesh
    P_mesh, Mx_mesh, My_mesh = generate_3d_interaction_surface(
        Ast, b, D, fck, fy, Es, d_dash, num_points=40
    )

    # 1. Plot the 3D Capacity Surface
    surf = ax2.plot_surface(
        Mx_mesh, My_mesh, P_mesh, 
        cmap='viridis', alpha=0.6, edgecolor='k', linewidth=0.2
    )

    # 2. Plot the Required Design Load Point
    ax2.scatter(
        Mux_required, Muy_required, Pu_required, 
        color='red', s=120, zorder=10, label="Required Load Point"
    )

    # 3. Add drop-lines from required point to axes for clarity
    ax2.plot([Mux_required, Mux_required], [Muy_required, Muy_required], [0, Pu_required], 'r--', alpha=0.7)
    ax2.plot([0, Mux_required], [Muy_required, Muy_required], [Pu_required, Pu_required], 'r--', alpha=0.7)
    ax2.plot([Mux_required, Mux_required], [0, Muy_required], [Pu_required, Pu_required], 'r--', alpha=0.7)

    # Axis Labels & Title
    ax2.set_xlabel('$M_{ux}$ (kNm)', fontsize=10, labelpad=10)
    ax2.set_ylabel('$M_{uy}$ (kNm)', fontsize=10, labelpad=10)
    ax2.set_zlabel('$P_u$ (kN)', fontsize=10, labelpad=10)
    
    ax2.set_title("3D $P_u - M_{ux} - M_{uy}$ Interaction Surface", fontsize=12, pad=12)

    fig.colorbar(surf, ax=ax2, shrink=0.5, aspect=10, label="Axial Load $P_u$ (kN)")
    ax2.legend(loc="upper right")

    # Set initial camera angle
    ax2.view_init(elev=25, azim=135)

    plt.suptitle(f"Biaxial Interaction Analysis\n{b:.0f}×{D:.0f} mm | M{fck:.0f} / Fe{fy:.0f} | $A_{{st}} = {Ast_percent:.3f}\\%$", fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.show()
 