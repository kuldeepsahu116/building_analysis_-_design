import math
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

#-------------------------------------------
# Bending Design function
#-------------------------------------------
 
def singly_reinforced_design(Mu, b, D, d_effective, fck, fy, Xulim_by_d, Mu_lim):

    Xu_lim = Xulim_by_d * d_effective

    # Required tension reinforcement
    A_st_required = calculate_required_ast(Mu, b, d_effective, fck, fy)

    A_st_min = 0.85 * b * d_effective / fy

    A_st_required = round(max(A_st_required, A_st_min), 2)

    # Neutral axis depth
    Xu = round((0.87 * fy * A_st_required) / (0.36 * fck * b), 2)

    return {
        "design_type": "singly",

        "D": D,
        "d": d_effective,

        # Tension reinforcement
        "Ast_required": A_st_required,

        # Compression reinforcement
        "Asc_required": None,

        # Section parameters
        "Xu": Xu,
        "Xu_lim": round(Xu_lim, 2),
        "Mu_lim": round(Mu_lim, 2)}

    
def doubly_reinforced_design(Mu, b, D, d_effective, fck, fy, d_dash, Xulim_by_d, Mu_lim):

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

    # Neutral axis depth
    Xu=round((0.87*fy*Ast_required - (f_sc - f_cc)*Asc_required)/(0.36*fck*b),2)

    return {
        "design_type": "doubly",

        "D": D,
        "d": d_effective,

        # Tension reinforcement
        "Ast_required": Ast_required,

        # Compression reinforcement
        "Asc_required": Asc_required,

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


def bending_design(Mu, b, D, d_effective, fck, fy, d_dash):

    # Common section parameters
    
    Xulim_by_d=round(0.0035/((0.87*fy/200000)+0.0055),2)

    Q_max=round(0.36*fck*Xulim_by_d*(1-0.42*Xulim_by_d),2)

    Mu_lim = Q_max * b * (d_effective**2)

    # Select design type

    if Mu <= Mu_lim:
        
        return singly_reinforced_design(Mu, b, D, d_effective, fck, fy, Xulim_by_d, Mu_lim)
    
    else:

        return doubly_reinforced_design(Mu, b, D, d_effective, fck, fy, d_dash, Xulim_by_d, Mu_lim)


#-------------------------------------------
#Shear Design 
#-------------------------------------------
def Shear_design(Vu,Ast_percent,fck,fy,b,d):
    
    tau_c,tau_c_max = get_tau_c(Ast_percent,fck)
    tau_v=Vu*1000/(b*d)

    if tau_v > tau_c_max:
        raise ValueError(
            "Shear stress exceeds the maximum permitted value. "
            "Increase beam dimensions."
        )

    # IS 456:2000, Clause 26.5.1.6
    Asv_min_per_m = (0.4 * b * 1000) / (0.87 * fy)

    Vus = max(0, Vu * 1000 - tau_c * b * d)

    Asv_required_per_m = (Vus * 1000 / (0.87 * fy * d))

    return max(Asv_min_per_m, Asv_required_per_m)


#-------------------------------------------
# RUN FUNCTION
#-------------------------------------------

def design_beam(data):

    b=float(data["b"])
    D=float(data["D"])

    Vu=abs(float(data["Vu"]))
    Mu=float(data["Mu"])

    fck=float(data["fck"])
    fy=float(data["fy"])

    cover=float(data["effective_cover"]) 

    d_dash = cover

    d = D - cover   

    bending_result = bending_design(Mu*1000000, b, D, d, fck,fy, d_dash)

    d_eff = bending_result["d"]
    Ast_required = bending_result["Ast_required"]

    Ast_percent=Ast_required*100/(b*d_eff)

    Asv_per_m = Shear_design(Vu,Ast_percent,fck,fy,b,d_eff)

    return {
        "bending": bending_result,

        "shear": {
            "Asv_per_m": round(Asv_per_m, 2)
        }
    }

if __name__ == "__main__":

    data = {
        "b": 230,               # mm
        "D": 430,               # mm
        "Mu": 140,              # kNm
        "Vu": 150,              # kN
        "fck": 30,              # MPa
        "fy": 500,              # MPa
        "effective_cover": 40  # mm
    }

    try:
        result = design_beam(data)

        bending = result["bending"]
        shear = result["shear"]

        print("\n" + "=" * 50)
        print("             BEAM DESIGN RESULTS")
        print("=" * 50)

        print("\nSECTION DETAILS")
        print(f"Width (b)             : {data['b']} mm")
        print(f"Overall Depth (D)     : {data['D']} mm")
        print(f"Effective Depth (d)   : {bending['d']:.2f} mm")
        print(f"Effective Cover       : {data['effective_cover']} mm")

        print("\nBENDING DESIGN")
        print(f"Design Type           : {bending['design_type'].upper()}")
        print(f"Applied Moment        : {data['Mu']:.2f} kNm")
        print(f"Limiting Moment       : {bending['Mu_lim'] / 1e6:.2f} kNm")
        print(f"Neutral Axis (Xu)     : {bending['Xu']:.2f} mm")
        print(f"Limiting Xu           : {bending['Xu_lim']:.2f} mm")
        print(f"Required Tension Ast  : {bending['Ast_required']:.2f} mm²")

        if bending["design_type"] == "doubly":
            print(f"Required Compression Asc: {bending['Asc_required']:.2f} mm²")
            print(f"Additional Moment     : {bending['Mu2'] / 1e6:.2f} kNm")

        print("\nSHEAR DESIGN")
        print(f"Applied Shear         : {data['Vu']:.2f} kN")
        print(f"Required Asv          : {shear['Asv_per_m']:.2f} mm²/m")

        print("\n" + "=" * 50)
        print("             DESIGN COMPLETED")
        print("=" * 50)

    except (ValueError, KeyError, TypeError) as error:
        print(f"\nDESIGN ERROR: {error}")