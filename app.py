from flask import Flask, render_template, request, jsonify
import numpy as np
from stuructural_analysis_solver import Member, run_analysis

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/analyze", methods=["POST"])
def analyze():

    try:
        data = request.get_json()

        # nodes = {int(k): tuple(v) for k,v in data["nodes"].items()}
        # --------------------------------
        # NODES
        # --------------------------------

        raw_nodes = data["nodes"]

        # NODE LABEL → INDEX MAP
        node_map = {}
        nodes = {}

        for i, (label, coord) in enumerate(raw_nodes.items()):
            node_map[label] = i
            nodes[i] = tuple(coord)

        # --------------------------------
        # MEMBERS
        # --------------------------------
        members = []
        for i, m in enumerate(data["members"]):

            if str(m["start"]) not in node_map:
                raise ValueError(f"Invalid start node {m['start']}")

            if str(m["end"]) not in node_map:
                raise ValueError(f"Invalid end node {m['end']}")
        
            start_index = node_map[str(m["start"])]
            end_index = node_map[str(m["end"])]
            members.append(Member(
                i,
                start_index, 
                end_index,
                m["E"], m["G"], m["A"], m["Iyy"], m["Izz"], m["J"],
                m.get("beta", 0.0)
            ))

        # -----------------------------
        # SUPPORTS
        # -----------------------------

        fixed_dofs = []

        support_settlements = {}


        for s in data["supports"]:

            for node_label in s["assignedNodes"]:

                if str(node_label) not in node_map:

                    raise ValueError(
                        f"Support node '{node_label}' does not exist")

                node = node_map[str(node_label)]


                # ---------------------------------
                # RESTRAINED DOFs
                # ---------------------------------

                if s["ux"]:
                    fixed_dofs.append(6 * node + 0)

                if s["uy"]:
                    fixed_dofs.append(6 * node + 1)

                if s["uz"]:
                    fixed_dofs.append(6 * node + 2)

                if s["rx"]:
                    fixed_dofs.append(6 * node + 3)

                if s["ry"]:
                    fixed_dofs.append(6 * node + 4)

                if s["rz"]:
                    fixed_dofs.append(6 * node + 5)

                # ---------------------------------
                # SUPPORT SETTLEMENT
                # ---------------------------------

                if s["type"] == "support_deflection":

                    support_settlements[node] = (

                        s["uxValue"] if s["ux"] else 0.0,

                        s["uyValue"] if s["uy"] else 0.0,

                        s["uzValue"] if s["uz"] else 0.0,

                        s["rxValue"] if s["rx"] else 0.0,

                        s["ryValue"] if s["ry"] else 0.0,

                        s["rzValue"] if s["rz"] else 0.0

                    )


        fixed_dofs = np.array(fixed_dofs).reshape(-1,1)

        # -----------------------------
        # LOADS
        # -----------------------------

        F_node = np.zeros((6*len(nodes),1))

        # -----------------------------------------------------
        # MEMBER LOOKUP
        # UI LABEL -> MEMBER INDEX
        # -----------------------------------------------------

        member_map = {
            str(m["name"]): i
            for i, m in enumerate(data["members"])
        }

        # =====================================================
        # APPLY LOADS
        # =====================================================
        for load in data["loads"]:

            category = load["category"]
            direction = load["direction"]

            # NODAL LOADS 

            if category == "nodal":

                value = load["value1"]

                force_dof = {
                "X": 0,
                "Y": 1,
                "Z": 2,
                "MX": 3,
                "MY": 4,
                "MZ": 5
            }

                for node_label in load["assignedNodes"]:

                    #VALIDATION: NODE EXISTS
                    if str(node_label) not in node_map:

                        raise ValueError(
                            f"Load node '{node_label}' does not exist"
                        )

                    node_index = node_map[str(node_label)]

                    F_node[6*node_index + force_dof[direction], 0] += value

        # MEMBER LOADS

            # Only member loads
            elif category == "member":

                load_type = load["type"]

                for member_label in load["assignedMembers"]:

                    #VALIDATION: MEMBER EXISTS
                    if member_label not in member_map:

                        raise ValueError(
                            f"Load member '{member_label}' does not exist"
                        )

                    member = members[member_map[member_label]]

                    # POINT LOAD
                    if load_type == "point":

                        member.add_point_load(
                            load["value1"],
                            load["a"],
                            direction
                        )
                        
                    # UDL
                    elif load_type == "udl":

                        member.add_udl(
                            load["value1"],
                            direction
                        )

                    # PARTIAL UDL
                    elif load_type == "partial_udl":

                        member.add_partial_udl(
                            load["value1"],
                            load["a"],
                            load["b"],
                            direction
                        )

                    # TRAPEZOIDAL
                    elif load_type == "trapezoidal":

                        member.add_trapezoidal_load(
                            load["value1"],
                            load["value2"],
                            direction
                        )

                    # MOMENT
                    elif load_type == "moment":

                        member.add_moment_load(
                            load["value1"],
                            load["a"],
                            direction
                        )

        result = run_analysis(nodes, members, F_node, fixed_dofs, support_settlements)

        reverse_node_map = {
            v:k for k,v in node_map.items()
        }
        member_labels = [
            str(m["name"])
            for m in data["members"]
        ]

        return jsonify({
            "displacements": result["displacements"].flatten().tolist(),
            "reactions": result["reactions"].flatten().tolist(),
            "node_labels": reverse_node_map,
            "member_labels": member_labels,
            "member_forces": [m.f_memb_force_local.flatten().tolist()
                              for m in result["members"]],
            "afd": [{
                    "member": member_labels[i],
                    "x": m.axial_x,
                    "N": m.axial_N,
                    "max_N": m.max_axial,
                    "x_max_N": m.x_max_axial,
                    "min_N": m.min_axial,
                    "x_min_N": m.x_min_axial
                } for i,m in enumerate(result["members"])],
            "sfd": [{
                    "member":member_labels[i],
                    "x": m.shear_x,
                    "V": m.shear_V,
                    "max_V": m.max_shear,
                    "x_max_V": m.x_max_shear,
                    "min_V": m.min_shear,
                    "x_min_V":m.x_min_shear}
                for i,m in enumerate(result["members"])],
            "bmd": [{
                    "member":member_labels[i],
                    "x": m.moment_x,
                    "M": m.moment_M,
                    "max_M": m.max_moment,
                    "x_max_M": m.x_max_moment,
                    "min_M": m.min_moment,
                    "x_min_M": m.x_min_moment}
                    for i,m in enumerate(result["members"])],
            "tmd": [{
                    "member": member_labels[i],
                    "x": m.torsion_x,
                    "T": m.torsion_T,
                    "max_T": m.max_torsion,
                    "x_max_T": m.x_max_torsion,
                    "min_T": m.min_torsion,
                    "x_min_T": m.x_min_torsion
                } for i,m in enumerate(result["members"])],
            "deflection_shapes": [{
                    "member": member_labels[i],
                    "position": m.deflection_position,
                    "local_x": m.deflection_local_x,
                    "local_y": m.deflection_local_y,
                    "local_z": m.deflection_local_z,
                    "x": m.deflection_x,
                    "y": m.deflection_y,
                    "z": m.deflection_z,
                    "max_deflection": m.max_deflection,
                    "x_max_deflection": m.x_max_deflection,
                    "min_deflection": m.min_deflection,
                    "x_min_deflection": m.x_min_deflection}
                for i,m in enumerate(result["members"])],
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True)