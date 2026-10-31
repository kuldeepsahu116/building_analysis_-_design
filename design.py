import numpy as np

from beam_design import design_beam as calculate_beam
from column_design import design_column as calculate_column


# ============================================================
# 1. BEAM DESIGN CLASS
# ============================================================

class BeamDesign:

    def __init__(self, member_id):
        self.member_id = member_id
        self.member_type = "beam"

        self.properties = {}
        self.analysis = {}
        self.results = {}
        self.is_designed = False

    def assign_properties(self, data):
        self.properties = {
            "b": float(data["b"]),
            "D": float(data["D"]),
            "effective_cover": float(data["effective_cover"]),
            "fck": float(data["fck"]),
            "fy": float(data["fy"])
        }

        self.properties["moment_direction"] = data.get(
            "moment_direction", "z"
        )
        self.properties["shear_direction"] = data.get(
            "shear_direction", "y"
        )

    def assign_analysis_results(self, member):
        md = self.properties["moment_direction"]
        sd = self.properties["shear_direction"]

        self.analysis = {
            "length": member.L,
            "x": member.moment_x,
            "BMD": member.moment_M[md],
            "SFD_x": member.shear_x,
            "SFD": member.shear_V[sd],
            "AFD": member.axial_N,
            "TMD": member.torsion_T
        }

    def design(self):

        p = self.properties
        a = self.analysis

        if not a["x"] or not a["SFD_x"]:
            raise ValueError(
                f"Analysis curves missing for beam {self.member_id}"
            )

        stations = {
            "start": 0.0,
            "centre": a["length"] / 2,
            "end": a["length"]
        }

        results = {}

        for name, position in stations.items():

            Mu = float(np.interp(position, a["x"], a["BMD"]))
            Vu = float(np.interp(position, a["SFD_x"], a["SFD"]))

            # Existing beam design function expects positive
            # moment magnitude. Sign determines tension face.
            result = calculate_beam({
                "b": p["b"],
                "D": p["D"],
                "effective_cover": p["effective_cover"],
                "fck": p["fck"],
                "fy": p["fy"],
                "Mu": abs(Mu),
                "Vu": abs(Vu)
            })

            bending = result["bending"]
            Ast = bending["Ast_required"] or 0.0
            Asc = bending["Asc_required"] or 0.0

            if Mu < 0:
                As_top = Ast
                As_bottom = Asc
            else:
                As_top = Asc
                As_bottom = Ast

            results[name] = {
                "x": position,
                "Mu": round(Mu, 3),
                "Vu": round(Vu, 3),

                "As_top": As_top,
                "As_bottom": As_bottom,

                "Asv": result["shear"]["Asv_per_m"],

                "design_type": bending["design_type"],
                "status": "DESIGNED"
            }

        self.results = {
            "stations": results,

            "max_As_top":max(r["As_top"] for r in results.values()),
            "max_As_bottom":max(r["As_bottom"] for r in results.values()),

            "max_Asv": max(
                r["Asv"] for r in results.values()
            ),

            "governing_As_top": max(
                results, key=lambda k: results[k]["As_top"]
            ),
            "governing_As_bottom": max(
                results, key=lambda k: results[k]["As_bottom"]
            ),
            "governing_Asv": max(
                results, key=lambda k: results[k]["Asv"]
            )
        }

        self.is_designed = True
        return self.results


# ============================================================
# 2. COLUMN DESIGN CLASS
# ============================================================

class ColumnDesign:

    def __init__(self, member_id):
        self.member_id = member_id
        self.member_type = "column"

        self.properties = {}
        self.analysis = {}
        self.results = {}
        self.is_designed = False

    def assign_properties(self, data):
        self.properties = {
            "b": float(data["b"]),
            "D": float(data["D"]),
            "effective_cover": float(data["effective_cover"]),
            "fck": float(data["fck"]),
            "fy": float(data["fy"]),
            "Le_x": float(data["Le_x"]),
            "Le_y": float(data["Le_y"]),
            "Ast_min_percent": float(
                data.get("Ast_min_percent", 0.8)
            ),
            "Ast_max_percent": float(
                data.get("Ast_max_percent", 4.0)
            )
        }

        self.properties["moment_y_direction"] = data.get(
            "moment_y_direction", "y"
        )
        self.properties["moment_z_direction"] = data.get(
            "moment_z_direction", "z"
        )

    def assign_analysis_results(self, member):

        self.analysis = {
            "AFD": member.axial_N,
            "BMD_y": member.moment_M["y"],
            "BMD_z": member.moment_M["z"],
            "length": member.L
        }

    def design(self):

        p = self.properties
        a = self.analysis

        if not a["AFD"] or not a["BMD_y"] or not a["BMD_z"]:
            raise ValueError(
                f"Analysis results missing for column {self.member_id}"
            )

        # Maximum force magnitudes from the available curves
        Pu = float(np.max(np.abs(a["AFD"])))

        moment_y = np.asarray(a["BMD_y"], dtype=float)
        moment_z = np.asarray(a["BMD_z"], dtype=float)

        direction_x = p["moment_y_direction"]
        direction_y = p["moment_z_direction"]

        Mux = float(np.max(np.abs(
            moment_y if direction_x == "y" else moment_z
        )))

        Muy = float(np.max(np.abs(
            moment_y if direction_y == "y" else moment_z
        )))

        result = calculate_column({
            "b": p["b"],
            "D": p["D"],
            "effective_cover": p["effective_cover"],
            "fck": p["fck"],
            "fy": p["fy"],
            "Le_x": p["Le_x"],
            "Le_y": p["Le_y"],
            "Pu": Pu,
            "Mux": Mux,
            "Muy": Muy,
            "Ast_min_percent": p["Ast_min_percent"],
            "Ast_max_percent": p["Ast_max_percent"]
        })

        self.results = {
            **result,
            "design_forces": {
                "Pu": Pu,
                "Mux": Mux,
                "Muy": Muy
            }
        }

        self.is_designed = True
        return self.results


# ============================================================
# 3. CREATE DESIGN MEMBERS
# ============================================================

def create_design_members(members, design_inputs):

    design_members = []

    for member in members:

        member_id = member.name
        data = design_inputs.get(str(member_id))

        if not data:
            continue

        member_type = data["member_type"].lower()

        if member_type == "beam":
            design_member = BeamDesign(member_id)

        elif member_type == "column":
            design_member = ColumnDesign(member_id)

        else:
            raise ValueError(
                f"Invalid member type for member {member_id}"
            )

        design_member.assign_properties(data)
        design_members.append(design_member)

    return design_members


# ============================================================
# 4. ASSIGN ANALYSIS RESULTS
# ============================================================

def assign_analysis_results(design_members, members):

    member_map = {m.name: m for m in members}

    for design_member in design_members:

        member = member_map.get(design_member.member_id)

        if member is None:
            raise ValueError(
                f"Analysis member {design_member.member_id} not found"
            )

        design_member.assign_analysis_results(member)


# ============================================================
# 5. RUN DESIGN
# ============================================================

def run_design(members, design_inputs):

    design_members = create_design_members(members, design_inputs)

    assign_analysis_results(design_members, members)

    for design_member in design_members:

        try:
            design_member.design()

        except (ValueError, KeyError, TypeError, ZeroDivisionError) as error:
            design_member.results = {
                "status": "ERROR",
                "error": str(error)
            }

    return design_members


# ============================================================
# 6. COLLECT DESIGN RESULTS
# ============================================================

def collect_design_results(design_members):

    return {
        str(member.member_id): {
            "member_type": member.member_type,
            "status": (
                "DESIGNED" if member.is_designed else "ERROR"
            ),
            "results": member.results
        }
        for member in design_members
    }


# ============================================================
# 7. TEST DESIGN MODULE
# ============================================================

if __name__ == "__main__":

    from types import SimpleNamespace

    # Sample analysis data
    x = np.linspace(0, 6000, 5)

    members = [
        SimpleNamespace(
            name=0,
            L=6000,
            moment_x=x.tolist(),
            moment_M={
                "y": [0, 15, 25, 15, 0],
                "z": [0, -20, -35, -20, 0]
            },
            shear_x=x.tolist(),
            shear_V={
                "y": [50, 25, 0, -25, -50],
                "z": [30, 15, 0, -15, -30]
            },
            axial_N=[0, 0, 0, 0, 0],
            torsion_T=[0, 0, 0, 0, 0]
        ),

        SimpleNamespace(
            name=1,
            L=3000,
            moment_x=x.tolist(),
            moment_M={
                "y": [10, 20, 30, 20, 10],
                "z": [5, 10, 15, 10, 5]
            },
            shear_x=x.tolist(),
            shear_V={
                "y": [40, 20, 0, -20, -40],
                "z": [20, 10, 0, -10, -20]
            },
            axial_N=[-500, -550, -600, -550, -500],
            torsion_T=[0, 0, 0, 0, 0]
        )
    ]

    # Design inputs
    design_inputs = {
        "0": {
            "member_type": "beam",
            "b": 300,
            "D": 450,
            "effective_cover": 40,
            "fck": 30,
            "fy": 500,
            "moment_direction": "z",
            "shear_direction": "y"
        },

        "1": {
            "member_type": "column",
            "b": 450,
            "D": 450,
            "effective_cover": 50,
            "fck": 30,
            "fy": 500,
            "Le_x": 3000,
            "Le_y": 3000,
            "Ast_min_percent": 0.8,
            "Ast_max_percent": 4.0
        }
    }

    # Run design
    design_members = run_design(members, design_inputs)
    results = collect_design_results(design_members)

    # Display results
    for member_id, data in results.items():
        print(f"\n{'=' * 50}")
        print(f"Member ID: {member_id}")
        print(f"Member Type: {data['member_type']}")
        print(f"Status: {data['status']}")
        print(f"{'=' * 50}")

        print(data["results"])