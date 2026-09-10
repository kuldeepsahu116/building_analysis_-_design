import math
from beam_Ast_to_bars import min_ast_by_bars_required
from shear_stress import get_tau_c
from stress_strain_relation import calc_steel_stress, calc_concrete_stress

def calculate_required_ast(Mu, b, d, fck, fy):

    a = 0.87 * (fy ** 2) / (fck * b)
    b_term = -0.87 * fy * d
    c = Mu

    discriminant = b_term ** 2 - 4 * a * c

    if discriminant < 0:
        raise ValueError(
            "Moment demand cannot be satisfied using the current section dimensions.")

    Ast = (-b_term - math.sqrt(discriminant)) / (2 * a)

    return round(Ast, 2)

def filter_diameters(Ast_required, diameters):

    if Ast_required > 7000:
        min_dia = 25
    elif Ast_required > 4000:
        min_dia = 20
    elif Ast_required > 2000:
        min_dia = 16
    elif Ast_required > 800:
        min_dia = 12
    else:
        min_dia = 10

    return [d for d in diameters if d >= min_dia]

#-------------------------------------------
# Bending Design function
#-------------------------------------------
 
def singly_reinforced_design(Mu, b, D, d_effective, fck, fy, side_cover, aggregate_size, diameters, Xulim_by_d, Mu_lim):

    Xu_lim = Xulim_by_d * d_effective

    # Required tension reinforcement
    A_st_required = calculate_required_ast(Mu, b, d_effective, fck, fy)

    A_st_min = 0.85 * b * d_effective / fy

    A_st_required = round(max(A_st_required, A_st_min), 2)

    # Select Reinforcement Bars
    allowed_dias = filter_diameters(A_st_required, diameters)

    combo, Ast_provided, distribution, layers = min_ast_by_bars_required(A_st_required, b, side_cover, aggregate_size, allowed_dias)

    Ast_provided = round(Ast_provided, 2)

    # Neutral axis depth
    Xu = round((0.87 * fy * Ast_provided) / (0.36 * fck * b), 2)

    # Safety check
    if Xu > Xu_lim:
        raise ValueError("Provided depth is insufficient for singly reinforced design.")

    return {
        "design_type": "singly",

        "D": D,
        "d": d_effective,

        # Tension reinforcement
        "Ast_required": A_st_required,
        "Ast_provided": Ast_provided,
        "Ast_distribution": distribution,
        "Ast_layers": layers,
        "Ast_combo": combo,

        # Compression reinforcement
        "Asc_required": None,
        "Asc_provided": None,
        "Asc_distribution": None,   
        "Asc_layers": None,
        "Asc_combo": None,

        # Section parameters
        "Xu": Xu,
        "Xu_lim": round(Xu_lim, 2),
        "Mu_lim": round(Mu_lim, 2)}

    
def doubly_reinforced_design(Mu, b, D, d_effective, fck, fy, side_cover, aggregate_size, diameters, Xulim_by_d, Mu_lim):

    d_dash = 30  # Temproray value
    Xu_lim=Xulim_by_d*d_effective

    # Additional moment
    Mu2 = Mu - Mu_lim

    # Limiting tension reinforcement
    A_st1 = calculate_required_ast(Mu_lim, b, d_effective, fck, fy)

    # Additional tension reinforcement
    A_st2 = Mu2 / (0.87 * fy * (d_effective - d_dash))

    # Total tension reinforcement
    Ast = A_st1 + A_st2
    A_st_min = 0.85*b*d_effective/fy
    Ast_required = round(max(Ast, A_st_min), 2)

    # Required compression reinforcement
    strain_steel = 0.0035 * (Xu_lim - d_dash) / Xu_lim
    f_sc = calc_steel_stress(fy, strain_steel)
    f_cc = calc_concrete_stress(fck, strain_steel)

    Asc_required = 0.87*fy*A_st2/(f_sc - f_cc)
    Asc_required = round(Asc_required, 2)

    # Select tension reinforcement
    allowed_dias_Ast = filter_diameters(Ast_required, diameters)

    combo_Ast, Ast_provided, distribution_Ast, layers_Ast = (
        min_ast_by_bars_required(
            Ast_required, b, side_cover, aggregate_size,allowed_dias_Ast)
    )

    Ast_provided=round(Ast_provided,2)

    # Select compression reinforcement
    allowed_dias_Asc = filter_diameters(Asc_required, diameters)

    combo_Asc, Asc_provided, distribution_Asc, layers_Asc = (
        min_ast_by_bars_required(
            Asc_required, b, side_cover, aggregate_size,allowed_dias_Asc)
    )

    Asc_provided=round(Asc_provided,2)

    # Neutral axis depth
    Xu=round((0.87*fy*Ast_provided - (f_sc - f_cc)*Asc_provided)/(0.36*fck*b),2)

    return {
        "design_type": "doubly",

        "D": D,
        "d": d_effective,

        # Tension reinforcement
        "Ast_required": round(Ast_required, 2),
        "Ast_provided": Ast_provided,
        "Ast_distribution": distribution_Ast,
        "Ast_layers": layers_Ast,
        "Ast_combo": combo_Ast,

        # Compression reinforcement
        "Asc_required": Asc_required,
        "Asc_provided": round(Asc_provided, 2),
        "Asc_distribution": distribution_Asc,
        "Asc_layers": layers_Asc,
        "Asc_combo": combo_Asc,

        # Section parameters
        "Xu": Xu,
        "Xu_lim": round(Xu_lim, 2),
        "Mu_lim": round(Mu_lim, 2),

        # Additional information
        "Ast1": round(A_st1, 2),
        "Ast2": round(A_st2, 2),
        "Mu2": round(Mu2, 2),
        "d_dash": d_dash
    }


def bending_design(Mu, b, D, fck, fy, clear_cover, side_cover, Max_bar_dia, aggregate_size, diameters):

    # Common section parameters
    
    Xulim_by_d=round(0.0035/((0.87*fy/200000)+0.0055),2)

    Q_max=round(0.36*fck*Xulim_by_d*(1-0.42*Xulim_by_d),2)

    d_effective = D - clear_cover - (Max_bar_dia/2)

    Mu_lim = Q_max * b * (d_effective**2)

    # Select design type

    if Mu <= Mu_lim:
        
        return singly_reinforced_design(Mu, b, D, d_effective, fck, fy, side_cover, aggregate_size, diameters, Xulim_by_d, Mu_lim)
    
    else:

        return doubly_reinforced_design(Mu, b, D, d_effective, fck, fy, side_cover, aggregate_size, diameters, Xulim_by_d, Mu_lim)


#-------------------------------------------
#Shear Design 
#-------------------------------------------

def Shear_spacing(factored_shear_force,fy,width,d_effective,tau_c,tau_c_max,tau_v,shearbar_dia,number_of_stirup_legs):
    if tau_v<=tau_c_max:
        A_sv=number_of_stirup_legs*3.14*(shearbar_dia**2)/4
        sv=min(300,0.75*d_effective)
        if tau_v<=tau_c:
            S=math.floor(min(sv,(0.87*fy*A_sv/(0.4*width)))/5)*5
        else:
            S=math.floor(min(sv,(0.87*fy*A_sv*d_effective/((factored_shear_force*1000)-(tau_c*width*d_effective))))/5)*5

    else:
        raise ValueError("Shear force exceeds maximum shear capacity. Increase beam depth or width.")
    return S


def Shear_design(factored_shear_force,Ast_percent,fck,fy,width,d_effective):
    
    Shear_diameters = [8, 10, 12]
    tau_c,tau_c_max = get_tau_c(Ast_percent,fck)
    tau_v=factored_shear_force*1000/(width*d_effective)
    MIN_SPACING = 75

    # 2-legged
    for dia in Shear_diameters:
        Sv = Shear_spacing(factored_shear_force,fy,width,d_effective,tau_c,tau_c_max,tau_v,dia,2)

        if Sv >= MIN_SPACING:
            return dia, 2, Sv

    # 3-legged
    for dia in Shear_diameters:
        Sv = Shear_spacing(factored_shear_force,fy,width,d_effective,tau_c,tau_c_max,tau_v,dia,3)

        if Sv >= MIN_SPACING:
            return dia, 3, Sv

    # 4-legged
    for dia in Shear_diameters:
        Sv = Shear_spacing(factored_shear_force,fy,width,d_effective,tau_c,tau_c_max,tau_v,dia,4)

        if Sv >= MIN_SPACING:
            return dia, 4, Sv

    raise ValueError("Suitable stirrup configuration not found. Increase beam depth or width.")


#-------------------------------------------
# RUN FUNCTION
#-------------------------------------------

def design_beam(data):

    b=float(data["b"])
    D=float(data["D"])

    Vu=float(data["Vu"])
    Mu=float(data["Mu"])

    fck=float(data["fck"])
    fy=float(data["fy"])
    bar_diameters=data["bar_diameters"]

    clear_cover=float(data["clear_cover"])
    side_cover=float(data["side_cover"])

    aggregate_size=float(data["aggregate_size"])
    

     # 🔴 INPUT VALIDATION
    if b <= 0:
            raise ValueError("Beam width must be greater than zero.")
    
    if D <= 0:
            raise ValueError("Beam depth must be greater than zero.")
    
    if Mu <= 0:
        raise ValueError("Factored moment must be greater than zero.")

    if Vu < 0:
        raise ValueError("Factored shear force cannot be negative.")

    if clear_cover <= 0:
        raise ValueError("Clear cover must be greater than zero.")

    if side_cover < 0:
        raise ValueError("Side cover cannot be negative.")
    

    def choose_bar_from_moment(Mu):

        if Mu <= 50:
            return 16
        elif Mu <= 150:
            return 20
        elif Mu <= 500:
            return 25
        else:
            return 32

    Max_bar_dia = choose_bar_from_moment(Mu)

    diameters = [d for d in bar_diameters if d <= Max_bar_dia]    


    bending_result = bending_design(Mu*1000000 , b, D, fck,fy, clear_cover,side_cover, Max_bar_dia,aggregate_size,diameters)

    d_eff = bending_result["d"]
    Ast_provided = bending_result["Ast_provided"]

    Ast_percent=Ast_provided*100/(b*d_eff)

    Shear_bar_dia,No_of_legs,Sv = Shear_design(Vu,Ast_percent,fck,fy,b,d_eff)

    return {
        "bending": bending_result,

        "shear": {
            "dia": Shear_bar_dia,
            "legs": No_of_legs,
            "spacing": Sv
        }
    }

if __name__ == "__main__":
    # Example input data
    data = {
        "b": 230,           # in mm
        "D": 430,           # in mm

        "Mu": 140,          # in Knm
        "Vu": 150,           # in KN

        "fck": 30,
        "fy": 500,
        "bar_diameters": [32,25,20,16,12,10],

        "clear_cover": 20,      # in mm
        "side_cover": 20,       # in mm

        "aggregate_size": 12    # in mm
        
    }

    result = design_beam(data)


    # BENDING DESIGN RESULTS

    bending = result["bending"]

    print("\n" + "=" * 60)
    print("              BEAM DESIGN SOLUTION")
    print("=" * 60)

    print("\n--- BENDING DESIGN ---")

    print(f"Design Type          : {bending['design_type'].upper()}")

    print(f"\nOverall Depth (D)    : {bending['D']:.2f} mm")
    print(f"Effective Depth (d)  : {bending['d']:.2f} mm")

    print(f"\nXu                   : {bending['Xu']:.2f} mm")
    print(f"Xu Limit             : {bending['Xu_lim']:.2f} mm")

    print(f"\nLimiting Moment      : {bending['Mu_lim'] / 1e6:.2f} kNm")

    # TENSION REINFORCEMENT

    print("\n--- TENSION REINFORCEMENT ---")

    print(f"Ast Required         : "f"{bending['Ast_required']:.2f} mm²")

    print(f"Ast Provided         : "f"{bending['Ast_provided']:.2f} mm²")

    print(f"Distribution         : "f"{bending['Ast_distribution']}")

    print(f"Number of Layers     : "f"{bending['Ast_layers']}")

    # COMPRESSION REINFORCEMENT

    if bending["design_type"] == "doubly":

        print("\n--- COMPRESSION REINFORCEMENT ---")

        print(f"Asc Required         : "f"{bending['Asc_required']:.2f} mm²")

        print(f"Asc Provided         : "f"{bending['Asc_provided']:.2f} mm²")

        print(f"Distribution         : "f"{bending['Asc_distribution']}")

        print(f"Number of Layers     : "f"{bending['Asc_layers']}")

        # Additional doubly reinforced information

        print("\n--- DOUBLY REINFORCED DESIGN DETAILS ---")

        print(f"Additional Moment    : "f"{bending['Mu2'] / 1e6:.2f} kNm")

        print(f"Ast1                 : "f"{bending['Ast1']:.2f} mm²")

        print(f"Ast2                 : "f"{bending['Ast2']:.2f} mm²")

        print(f"d'                   : "f"{bending['d_dash']:.2f} mm")

    # SHEAR DESIGN RESULTS

    shear = result["shear"]

    print("\n--- SHEAR DESIGN ---")

    print(f"Stirrup Diameter     : "f"{shear['dia']} mm")

    print(f"Number of Legs       : "f"{shear['legs']}")

    print(f"Stirrup Spacing      : "f"{shear['spacing']} mm")

    print("\n" + "=" * 60)
    print("              DESIGN COMPLETED")
    print("=" * 60)