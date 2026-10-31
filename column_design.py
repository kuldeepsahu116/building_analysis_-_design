
import math

from uniaxial_column_design import get_Ast_uniaxial
from biaxial_column_design import get_Ast_biaxial


ES = 200000.0  # MPa


def minimum_eccentricity(Le, dimension):
    """IS 456:2000, Clause 25.4."""
    return max(Le / 500 + dimension / 30, 20.0)


def axial_capacity(b, D, fck, fy, Ast):
    """IS 456:2000, Clause 39.3."""
    Ag = b * D
    Ac = Ag - Ast

    return (0.4 * fck * Ac + 0.67 * fy * Ast) / 1000


def axial_column_design(Pu, b, D, fck, fy,
                        Ast_min_percent=0.8,
                        Ast_max_percent=4.0):

    Ag = b * D

    # IS 456:2000, Clause 39.3
    Ast_required = (
        Pu * 1000 - 0.4 * fck * Ag
    ) / (0.67 * fy - 0.4 * fck)

    Ast_min = Ast_min_percent * Ag / 100
    Ast_max = Ast_max_percent * Ag / 100

    Ast = max(Ast_required, Ast_min)

    if Ast > Ast_max:
        raise ValueError(
            "Required axial reinforcement exceeds the maximum limit. "
            "Increase column dimensions."
        )

    Pu_capacity = (
        0.4 * fck * (Ag - Ast) + 0.67 * fy * Ast
    ) / 1000

    return {
        "Ast_required": round(Ast_required, 2),
        "Ast_min": round(Ast_min, 2),
        "Ast": round(Ast, 2),
        "Ast_percent": round(Ast / Ag * 100, 3),
        "Pu_capacity": round(Pu_capacity, 2),
        "status": "SAFE" if Pu_capacity >= Pu else "NOT SAFE"
    }


def design_column(data):

    # Section dimensions
    b = float(data["b"])
    D = float(data["D"])

    # Material properties
    fck = float(data["fck"])
    fy = float(data["fy"])

    # Effective cover to reinforcement centroid
    d_dash = float(data["effective_cover"])

    # Design loads
    Pu = float(data["Pu"])          # kN
    Mux = float(data.get("Mux", 0)) # kNm
    Muy = float(data.get("Muy", 0)) # kNm

    # Effective lengths in both directions
    Le_x = float(data["Le_x"])
    Le_y = float(data["Le_y"])

    # Reinforcement limits
    Ast_min_percent = float(data.get("Ast_min_percent", 0.8))
    Ast_max_percent = float(data.get("Ast_max_percent", 4.0))

    # Design tolerances
    Mu_tolerance = float(data.get("Mu_tolerance", 1.0))
    interaction_tolerance = float(
        data.get("interaction_tolerance", 0.01)
    )

    # --------------------------------------------------
    # INPUT VALIDATION
    # --------------------------------------------------

    values = [
        b, D, fck, fy, d_dash, Pu,
        Mux, Muy, Le_x, Le_y,
        Ast_min_percent, Ast_max_percent
    ]

    if not all(math.isfinite(x) for x in values):
        raise ValueError("All inputs must be finite numbers.")

    if min(b, D, fck, fy, Pu, Le_x, Le_y) < 0:
        raise ValueError("Dimensions, strengths, lengths and Pu must be positive.")

    if not 0 <= Mux or not 0 <= Muy:
        raise ValueError("Moment magnitudes must be non-negative.")

    if not 0 < d_dash < min(b, D) / 2:
        raise ValueError("Invalid effective cover.")

    if not 0 < Ast_min_percent < Ast_max_percent <= 6:
        raise ValueError("Invalid reinforcement percentage limits.")

    if Mu_tolerance <= 0 or interaction_tolerance <= 0:
        raise ValueError("Design tolerances must be positive.")

    # --------------------------------------------------
    # SHORT COLUMN CHECK - CLAUSE 25.1
    # --------------------------------------------------

    slenderness_x = Le_x / b
    slenderness_y = Le_y / D

    if slenderness_x > 12 or slenderness_y > 12:
        raise ValueError(
            "Column is slender. Slender-column design is not included."
        )

    # --------------------------------------------------
    # MINIMUM ECCENTRICITY - CLAUSE 25.4
    # --------------------------------------------------

    emin_x = minimum_eccentricity(Le_x, b)
    emin_y = minimum_eccentricity(Le_y, D)

    # clause 39.3 
    axial_e_limit_x = 0.05 * b
    axial_e_limit_y = 0.05 * D


    # Actual eccentricities
    ex = abs(Mux) * 1000 / Pu
    ey = abs(Muy) * 1000 / Pu

    # Design eccentricities
    ed_x = max(ex, emin_x)
    ed_y = max(ey, emin_y)

    # Convert design eccentricities to moments
    Mux_design = Pu * ed_x / 1000  # kNm
    Muy_design = Pu * ed_y / 1000  # kNm

    # A direction requires bending if:
    # 1. Actual eccentricity exceeds minimum eccentricity, OR
    # 2. Minimum eccentricity itself exceeds the Clause 39.3 limit.
    bending_x = (
        ex > emin_x or
        emin_x > axial_e_limit_x
    )

    bending_y = (
        ey > emin_y or
        emin_y > axial_e_limit_y
    )

    if not bending_x and not bending_y:
        design_type = "axial"

    elif bending_x and not bending_y:
        design_type = "uniaxial_x"

    elif not bending_x and bending_y:
        design_type = "uniaxial_y"

    else:
        design_type = "biaxial"


    # --------------------------------------------------
    # AXIAL COMPRESSION DESIGN
    # --------------------------------------------------
    if design_type == "axial":

        axial_result = axial_column_design(
            Pu=Pu,
            b=b,
            D=D,
            fck=fck,
            fy=fy,
            Ast_min_percent=Ast_min_percent,
            Ast_max_percent=Ast_max_percent
        )

        return {
            "design_type": "axial",
            "analysis_type": "direct_axial",
            **axial_result,

            "loads": {
                "Pu": Pu,
                "Mux": Mux,
                "Muy": Muy
            },

            "eccentricity": {
                "emin_x": round(emin_x, 2),
                "emin_y": round(emin_y, 2),
                "design_ex": round(ed_x, 2),
                "design_ey": round(ed_y, 2)
            }
        }

    # --------------------------------------------------
    # UNIAXIAL DESIGN - X DIRECTION
    # --------------------------------------------------

    if design_type == "uniaxial_x":

        result = get_Ast_uniaxial(b, D, fck, fy, ES, d_dash,
                Pu,Mux_design)

        Ast_percent, Ast, Mu_capacity, P_curve, M_curve = result

        return {
            "design_type": "uniaxial",
            "bending_direction": "X",
            "analysis_type": "uniaxial_interaction",
            "status": "SAFE" if Mu_capacity >= Mux_design else "NOT SAFE",

            "Ast": round(Ast, 2),
            "Ast_percent": round(Ast_percent, 3),

            "loads": {
                "Pu": Pu,
                "Mux_applied": Mux,
                "Muy_applied": Muy,
                "Mux_design": round(Mux_design, 2),
                "Muy_design": round(Muy_design, 2)
            },

            "capacity": {
                "Mu_capacity": round(Mu_capacity, 2),
                "Mu_required": round(Mux_design, 2)
            },

            "eccentricity": {
                "emin_x": round(emin_x, 2),
                "emin_y": round(emin_y, 2),
                "design_ex": round(ed_x, 2),
                "design_ey": round(ed_y, 2)
            }
        }


    # --------------------------------------------------
    # UNIAXIAL DESIGN - Y DIRECTION
    # --------------------------------------------------

    elif design_type == "uniaxial_y":

        # Rotate the section dimensions so that the
        # uniaxial calculation is performed in the Y direction.

        result = get_Ast_uniaxial(D, b, fck, fy, ES, d_dash,Pu, Muy_design)

        Ast_percent, Ast, Mu_capacity, P_curve, M_curve = result

        return {
            "design_type": "uniaxial",
            "bending_direction": "Y",
            "analysis_type": "uniaxial_interaction",
            "status": "SAFE" if Mu_capacity >= Muy_design else "NOT SAFE",

            "Ast": round(Ast, 2),
            "Ast_percent": round(Ast_percent, 3),

            "loads": {
                "Pu": Pu,
                "Mux_applied": Mux,
                "Muy_applied": Muy,
                "Mux_design": round(Mux_design, 2),
                "Muy_design": round(Muy_design, 2)
            },

            "capacity": {
                "Mu_capacity": round(Mu_capacity, 2),
                "Mu_required": round(Muy_design, 2)
            },

            "eccentricity": {
                "emin_x": round(emin_x, 2),
                "emin_y": round(emin_y, 2),
                "design_ex": round(ed_x, 2),
                "design_ey": round(ed_y, 2)
            }
        }


    # --------------------------------------------------
    # BIAXIAL DESIGN
    # --------------------------------------------------

    elif design_type == "biaxial":

        result = get_Ast_biaxial(b, D, fck, fy, ES, d_dash,
            Pu, Mux_design, Muy_design)

        (Ast_percent, Ast, Mux_capacity, Muy_capacity,
            Puz, interaction, alpha_n,
            P_curve_x, M_curve_x,
            P_curve_y, M_curve_y
        ) = result

        return {
            "design_type": "biaxial",
            "analysis_type": "biaxial_interaction",
            "status": "SAFE" if interaction <= 1 else "NOT SAFE",

            "Ast": round(Ast, 2),
            "Ast_percent": round(Ast_percent, 3),

            "loads": {
                "Pu": Pu,
                "Mux_applied": Mux,
                "Muy_applied": Muy,
                "Mux_design": round(Mux_design, 2),
                "Muy_design": round(Muy_design, 2)
            },

            "eccentricity": {
                "emin_x": round(emin_x, 2),
                "emin_y": round(emin_y, 2),
                "design_ex": round(ed_x, 2),
                "design_ey": round(ed_y, 2)
            },

            "capacity": {
                "Mux_capacity": round(Mux_capacity, 2),
                "Muy_capacity": round(Muy_capacity, 2),
                "Puz": round(Puz, 2),
                "interaction": round(interaction, 4),
                "alpha_n": round(alpha_n, 4)
            }
        }

# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    data = {
        "b": 300,                    # mm
        "D": 500,                    # mm

        "fck": 25,                   # MPa
        "fy": 500,                   # MPa

        "effective_cover": 50,       # mm

        "Pu": 1500,                  # kN
        "Mux": 0,                  # kNm
        "Muy": 0,                    # kNm

        "Le_x": 3000,                # mm
        "Le_y": 3000,                # mm

        "Ast_min_percent": 0.8,
        "Ast_max_percent": 4.0,

        "Mu_tolerance": 1.0,
        "interaction_tolerance": 0.01
    }

    try:
        result = design_column(data)

        print("\n" + "=" * 55)
        print("                 COLUMN DESIGN")
        print("=" * 55)

        print(f"\nDesign Category : {result['design_type'].upper()}")
        print(f"Design Status   : {result['status']}")

        if "Ast" in result:
            print(f"Required Ast    : {result['Ast']:.2f} mm²")
            print(f"Steel Percentage: {result['Ast_percent']:.3f} %")

        if "Pu_capacity" in result:
            print(f"Axial Capacity  : {result['Pu_capacity']:.2f} kN")

        if "capacity" in result:
            print("\nINTERACTION CAPACITY")
            for key, value in result["capacity"].items():
                print(f"{key:20}: {value}")

        print("\nECCENTRICITY")
        for key, value in result["eccentricity"].items():
            print(f"{key:20}: {value:.2f} mm")

        print("\n" + "=" * 55)

    except (ValueError, KeyError, TypeError) as error:
        print(f"\nCOLUMN DESIGN ERROR: {error}")
