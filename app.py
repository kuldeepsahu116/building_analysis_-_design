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

            # NODAL LOADS 

            if category == "nodal":

                Fx = float(load.get("Fx", 0.0))
                Fy = float(load.get("Fy", 0.0))
                Fz = float(load.get("Fz", 0.0))

                Mx = float(load.get("Mx", 0.0))
                My = float(load.get("My", 0.0))
                Mz = float(load.get("Mz", 0.0))

                for node_label in load.get(
                    "assignedNodes", []
                ):

                    # VALIDATE NODE
                    if str(node_label) not in node_map:

                        raise ValueError(
                            f"Load node '{node_label}' does not exist"
                        )

                    node_index = node_map[str(node_label)]

                    # GLOBAL FORCE
                    F_node[6 * node_index + 0, 0] += Fx
                    F_node[6 * node_index + 1, 0] += Fy
                    F_node[6 * node_index + 2, 0] += Fz

                    # GLOBAL MOMENT
                    F_node[6 * node_index + 3, 0] += Mx
                    F_node[6 * node_index + 4, 0] += My
                    F_node[6 * node_index + 5, 0] += Mz

        # MEMBER LOADS

            # Only member loads
            elif category == "member":

                load_type = load.get("type")

                coordinate_system = (
                    load.get("coordinate_system", "local").lower())

                # VALIDATE COORDINATE SYSTEM
                if coordinate_system not in (
                    "local",
                    "global"
                ):

                    raise ValueError(
                        f"Invalid coordinate system "
                        f"'{coordinate_system}'"
                    )

                # ASSIGNED MEMBERS

                for member_label in load.get(
                    "assignedMembers", []):

                    member_label = str(member_label)

                    # VALIDATE MEMBER
                    if member_label not in member_map:

                        raise ValueError(
                            f"Load member "
                            f"'{member_label}' does not exist"
                        )

                    member = members[
                        member_map[member_label]
                    ]

                    # POINT LOAD
                    if load_type == "point":

                        member.add_point_load(

                            Fx=float(load.get("Fx", 0.0)),
                            Fy=float(load.get("Fy", 0.0)),
                            Fz=float(load.get("Fz", 0.0)),

                            a=float(load.get("a", 0.0)),

                            Mx=float(load.get("Mx", 0.0)),
                            My=float(load.get("My", 0.0)),
                            Mz=float(load.get("Mz", 0.0)),

                            coordinate_system=coordinate_system
                        )

                    # UDL
                    elif load_type == "udl":

                        member.add_udl(

                            wx=float(load.get("wx", 0.0)),
                            wy=float(load.get("wy", 0.0)),
                            wz=float(load.get("wz", 0.0)),

                            coordinate_system=coordinate_system
                        )

                    # PARTIAL UDL
                    elif load_type == "partial_udl":

                        member.add_partial_udl(

                            wx=float(load.get("wx", 0.0)),
                            wy=float(load.get("wy", 0.0)),
                            wz=float(load.get("wz", 0.0)),

                            a=float(load.get("a", 0.0)),
                            b=float(load.get("b", 0.0)),

                            coordinate_system=coordinate_system
                        )

                    # TRAPEZOIDAL
                    elif load_type == "trapezoidal":

                        member.add_trapezoidal_load(

                            wx1=float(load.get("wx1", 0.0)),
                            wy1=float(load.get("wy1", 0.0)),
                            wz1=float(load.get("wz1", 0.0)),

                            wx2=float(load.get("wx2", 0.0)),
                            wy2=float(load.get("wy2", 0.0)),
                            wz2=float(load.get("wz2", 0.0)),

                            coordinate_system=coordinate_system
                        )

                    # UNKNOWN LOAD
                    else:
                        raise ValueError(
                            f"Unknown member load type "
                            f"'{load_type}'"
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