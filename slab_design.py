import math
# from unittest import result
from shear_stress import get_tau_c

# =========================================================
# INPUT DATA
# =========================================================
# Geometry (m)
L=4.3
B=6

Lx = min(L,B)          # Short span
Ly = max(L,B)          # Long span

support = "simply_supported"   # simply_supported / continuous

#resting wall width
wall_width=230              # mm

# Material
fck = 25          # MPa
fy = 415          # MPa

# Loads (kN/m2)
floor_finish = 1.0
live_load = 2.0

# Detailing
cover = 15        # mm
bar_dia = 10      # mm

# Slab strip width
b = 1000          # mm

# =========================================================
# IS 456 TABLE 27 – αx, αy (Simply supported on four sides)
# Ly/Lx : (alpha_x, alpha_y)
# =========================================================

ALPHA_TABLE = {
    1.0: (0.062, 0.062),
    1.1: (0.074, 0.061),
    1.2: (0.084, 0.059),
    1.3: (0.093, 0.055),
    1.4: (0.099, 0.051),
    1.5: (0.104, 0.046),
    1.75: (0.113, 0.037),
    2.0: (0.118, 0.029),
    2.5: (0.122, 0.020),
    3.0: (0.124, 0.014)
}

# =========================================================
# FUNCTIONS
# =========================================================

def slab_type(Lx, Ly):
    return "one_way" if (Ly / Lx) > 2 else "two_way"


def effective_depth(span, support):
    if support == "simply_supported":
        ratio = 30
    elif support == "continuous":
        ratio = 26
    elif support =="cantilever":
        ratio = 7
    return (span * 1000) / ratio

def effective_span(clear_span, wall_width, d, support_type):
    cc_span = clear_span + wall_width / 1000
    """
    Calculates effective span as per IS 456 Clause 22.2

    Parameters:
    clear_span  : clear distance between supports (m)
    cc_span     : centre-to-centre distance of supports (m)
    d           : effective depth (mm)
    support_type: 'simply_supported', 'continuous', 'cantilever'

    Returns:
    Effective span in metres (m)
    """

    if support_type in ["simply_supported", "continuous"]:
        # Clause 22.2(a)
        return min(clear_span + d / 1000, cc_span)

    elif support_type == "cantilever":
        # Clause 22.2(b)
        return clear_span + d / 1000

    else:
        raise ValueError("Invalid support type")

def factored_load(thickness, floor_finish, live_load):
    self_weight = thickness * 25
    return 1.5 * (self_weight + floor_finish + live_load)


def one_way_moment(wu, L):
    return wu * (L**2) / 8

def one_way_shear(wu,L):
    return wu*L/2

# =========================================================
# FLEXURE FUNCTIONS
# =========================================================
 
def bending_moment_depth(factoredmoment,fck,fy,b):

    Xulim_by_d=round(0.0035/((0.87*fy/200000)+0.0055),2)
    Q_max=round(0.36*fck*Xulim_by_d*(1-0.42*Xulim_by_d),2)

    d=(factoredmoment*1000000/(Q_max*b))**0.5
    return d


def get_alpha(Lx, Ly):

    ratio =round(Ly / Lx,3)
    keys = sorted(ALPHA_TABLE.keys())

    for i in range(len(keys) - 1):

        if keys[i] <= ratio <= keys[i + 1]:

            r1 = keys[i]
            r2 = keys[i + 1]

            ax1, ay1 = ALPHA_TABLE[r1]
            ax2, ay2 = ALPHA_TABLE[r2]

            # Linear interpolation
            ax = round(ax1 + (ax2 - ax1) * (ratio - r1) / (r2 - r1),3)
            ay = round(ay1 + (ay2 - ay1) * (ratio - r1) / (r2 - r1),3)
            return ax, ay


def two_way_moment(wu, Lx, Ly):
    alpha_x, alpha_y = get_alpha(Lx, Ly)
    Mx = alpha_x * wu * Lx**2
    My = alpha_y * wu * Lx**2
    return Mx, My


def limiting_moment(fck, b, d):
    return 0.138 * fck * b * d**2 / 1e6


def steel_required(Mu, fck, fy, b, d):
    Mu = Mu * 1e6
    A = 0.87 * fy * d
    B = (0.87 * fy) ** 2 / (fck * b)
    Ast = (A - math.sqrt(A**2 - 4 * B * Mu)) / (2 * B)
    return Ast


def minimum_steel(b, d, fy):
    return 0.0012 * b * d if fy >= 415 else 0.0015 * b * d


# =========================================================
# BAR SELECTION AND SPACING
# =========================================================

def select_bar(Ast_req, b, d):

    available_dias = [8, 10, 12]

    best_option = None

    for dia in available_dias:

        area_bar = math.pi * dia**2 / 4

        spacing = (area_bar * b) / Ast_req

        # Apply code limits
        spacing = min(spacing, 3*d, 300)

        # Practical minimum spacing
        if spacing < 75:
            continue

        # Round spacing
        spacing = math.floor(spacing/5)*5

        # Calculate provided steel
        Ast_prov = area_bar * b / spacing

        # Select best (maximum spacing → economical)
        if Ast_prov >= Ast_req:

            if best_option is None or (Ast_prov+5) < best_option[2]:
                best_option = (dia, spacing, Ast_prov)

    return best_option


# =========================================================
# SHEAR CHECK
# =========================================================

def shear_check(Vu, b, d, D, Ast_percent, fck):

    tau_c,tau_c_max = get_tau_c(Ast_percent, fck)

    # k from IS 456 Clause 40.2.1.1 table
    if D <= 150:
        k = 1.3
    elif D <= 175:
        k = 1.25
    elif D <= 200:
        k = 1.20
    elif D <= 225:
        k = 1.15
    elif D <= 250:
        k = 1.10
    elif D <= 275:
        k = 1.05
    else:
        k = 1.00


    tau_v = (Vu*1000)/(b*d)

    return tau_v < (k*tau_c)

# ========================================================
# control of deflection l/d_eff check
# ========================================================
# we will use the SP-24 clause 22.2.1 pg 55 to calculate modification factor  

def deflection_l_by_d_check(b ,d ,fy ,Ast_req ,Ast_prov ,support_type ,span):

    pt=100*Ast_prov/(b*d)                             # percentage of tension reinforcement provided 
    fs=0.58*fy*(Ast_req/Ast_prov)                     # steel stress of service loads in MPa
    fs = max(120, min(fs, 290))
    kt=1/(0.225+0.00322*fs-0.625*(math.log10(1/pt)))  # modification factor from SP-24 clause 22.2.1 pg 55

    
    # Basic L/d ratio from IS 456 clause 23.2.1
    if support_type == "simply_supported":
        basic_ratio = 20
    elif support_type == "continuous":
        basic_ratio = 26
    elif support_type == "cantilever":
        basic_ratio = 7
    else:
        raise ValueError("Invalid support type")

    allowable_l_by_d=basic_ratio*kt   

    actual_l_by_d=span*1000/d

    # check
    status = actual_l_by_d <= allowable_l_by_d

    return status


# =========================================================
# ONE WAY SLAB DESIGN
# =========================================================

def design_one_way():

    d = effective_depth(Lx, support)
    prev_Main_dia = None
    while True:

        #assume bar dia initially
        if prev_Main_dia is None:
            current_Main_dia = 10
        else:
            current_Main_dia = prev_Main_dia

        effective_Lx=effective_span(Lx, wall_width, d, support)
        D = (math.ceil((d + cover + current_Main_dia/2)/10))*10
        d=D-cover-current_Main_dia/2
        wu = factored_load(D / 1000, floor_finish, live_load)
        Mu = one_way_moment(wu, effective_Lx)
        Vu= one_way_shear(wu,effective_Lx)
        d_moment=bending_moment_depth(Mu,fck,fy,b)
        if d_moment > d:
            d = d_moment
            continue
    
        Main_Ast = steel_required(Mu, fck, fy, b, d)
        Main_Ast = max(Main_Ast, minimum_steel(b, d, fy))
        Main_reinforcement_result = select_bar(Main_Ast, b, d)
        if Main_reinforcement_result is None:
            d += 10
            continue

        Main_bar_dia, Main_bar_spacing, Main_Ast_prov = Main_reinforcement_result
        Distribution_Ast= minimum_steel(b, d, fy)
        Distribution_reinforecement_result = select_bar(Distribution_Ast, b, d)
        if Distribution_reinforecement_result is None:
            d += 10
            continue
        Distribution_bar_dia, Distribution_bar_spacing, Distribution_Ast_prov = Distribution_reinforecement_result

        Main_Ast_percent = (Main_Ast_prov / (b * d)) * 100

        if not shear_check(Vu , b, d, D, Main_Ast_percent, fck):
            d += 10
            continue

        if not deflection_l_by_d_check(b ,d ,fy ,Main_Ast ,Main_Ast_prov ,support ,Lx):
            d += 10
            continue    
        break
    
    #clause 26.5.2.2 maximum diameter of reinforcement bars should not exceed 1/8th of total depth of slab. 
    #we need to do something about it

    results = {
        "Slab Type": "One Way Slab",
        "Effective Span (m)": round(effective_Lx, 3),

        "Overall Depth (mm)": f"{D} mm",
        "Effective Depth (mm)": f"{round(d, 1)} mm",

        "Factored Load (kN/m2)": f"{round(wu, 2)} kN/m2",

        "Bending Moment (kNm/m)": f"{round(Mu, 2)} kNm/m",
        "Shear (kN)": f"{round(Vu, 2)} kN",

        "Main Steel Area (mm2/m)": f"{round(Main_Ast, 1)} mm2/m",
        "Provide Main Bars": f"{Main_bar_dia} mm @ {Main_bar_spacing} mm c/c",

        "Distribution Steel Area (mm2/m)": f"{round(Distribution_Ast, 1)} mm2/m",
        "Provide Distribution Bars": f"{Distribution_bar_dia} mm @ {Distribution_bar_spacing} mm c/c"
    }
    return results

# =========================================================
# TWO WAY SLAB DESIGN
# =========================================================

def design_two_way():

    d= effective_depth(Lx, support)
    prev_Bar_dia_x = None
    prev_Bar_dia_y = None

    while True:
        if prev_Bar_dia_x is None:
            bar_dia_x = 10
        else:
            bar_dia_x = prev_Bar_dia_x
        if prev_Bar_dia_y is None:
            bar_dia_y = 10
        else:
            bar_dia_y = prev_Bar_dia_y

        D = math.ceil((d + cover + (bar_dia_x/2))/10)*10
        dx = D - cover - bar_dia_x/2
        dy =dx - (bar_dia_x/2) - (bar_dia_y/2)
        effective_Lx=effective_span(Lx, wall_width, dx, support)
        effective_Ly=effective_span(Ly, wall_width, dy, support)
        wu = factored_load(D / 1000, floor_finish, live_load)
        Mx, My = two_way_moment(wu, effective_Lx, effective_Ly)
        Vu= one_way_shear(wu,effective_Lx)
        d_moment = bending_moment_depth(Mx, fck, fy, b)

        if d_moment > d:
            d = d_moment
            continue

        Ast_x = steel_required(Mx, fck, fy, b, dx)
        Ast_y = steel_required(My, fck, fy, b, dy)

        Ast_x = max(Ast_x, minimum_steel(b, dx, fy))
        Ast_y = max(Ast_y, minimum_steel(b, dy, fy))

        reinforcement_x_result = select_bar(Ast_x, b, d)
        reinforcement_y_result = select_bar(Ast_y, b, d)

        if reinforcement_x_result is None or reinforcement_y_result is None:
            d += 10
            continue

        new_bar_dia_x, bar_spacing_x, Ast_prov_x = reinforcement_x_result
        new_bar_dia_y, bar_spacing_y, Ast_prov_y = reinforcement_y_result

        # Check convergence of bar diameters
        if prev_Bar_dia_x != new_bar_dia_x or prev_Bar_dia_y != new_bar_dia_y:
            prev_Bar_dia_x = new_bar_dia_x
            prev_Bar_dia_y = new_bar_dia_y
            continue

        Ast_percent_x = (Ast_prov_x / (b * dx)) * 100
        if not shear_check(Vu , b, dx, D, Ast_percent_x , fck):
            d += 10
            continue

        if not deflection_l_by_d_check(b ,dx ,fy ,Ast_x ,Ast_prov_x ,support ,Lx):
            d += 10
            continue    
        
        break

    results = {
        "Slab Type": "Two Way Slab",
        "Effective Span in X (m)": round(effective_Lx, 3),
        "Effective Span in Y (m)": round(effective_Ly, 3),

        "Overall Depth (mm)": f"{D} mm",
        "Effective Depth in X (mm)": f"{round(dx, 3)} mm",
        "Effective Depth in Y (mm)": f"{round(dy, 3)} mm",

        "Factored Load (kN/m2)": f"{round(wu, 2)} kN/m2",

        "Moment in X (kNm/m)": f"{round(Mx, 2)} kNm/m",
        "Moment in Y (kNm/m)": f"{round(My, 2)} kNm/m",

        "Provide Main Bars in X": f"{new_bar_dia_x} mm @ {bar_spacing_x} mm c/c",
        "Provide Main Bars in Y": f"{new_bar_dia_y} mm @ {bar_spacing_y} mm c/c"
    }
    return results

def design_slab():
    slab_type_result = slab_type(Lx, Ly)
    if slab_type_result == "one_way":
        return design_one_way()
    else:
        return design_two_way()
# =========================================================
# RUN DESIGN
# =========================================================

output = design_slab()

for key, value in output.items():
    print(f"{key}: {value}")


