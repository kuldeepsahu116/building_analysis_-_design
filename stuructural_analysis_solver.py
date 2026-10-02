from dataclasses import dataclass, field
import numpy as np


# ----------------------------
# MEMBER CLASS DEFINITION
# ----------------------------
@dataclass
class Member:
    name: int
    start_node: int
    end_node: int
    E: float
    G: float
    A: float
    I_yy: float
    I_zz: float
    J: float
    beta: float = 0.0

    # LOAD STORAGE
    member_loads: list = field(default_factory=list)

    # GEOMETRIC PROPERTIES 
    start_point: tuple = field(init=False)
    end_point: tuple = field(init=False)
    L: float = field(init=False)

    ex: float = field(init=False)
    ey: float = field(init=False)
    ez: float = field(init=False)

    # MATRICES
    k_local: np.ndarray = field(init=False)
    k_global: np.ndarray = field(init=False)

    T: np.ndarray = field(init=False)

    # MEMBER END FORCES
    F_Fixed_local: np.ndarray = field(init=False)
    F_Fixed_Global: np.ndarray = field(init=False)

    # SUPPORT DISPLACEMENT 
    support_displacements_global: np.ndarray = field(init=False)
    support_displacements_local: np.ndarray = field(init=False)

    # MEMBER RESULTS
    f_memb_force_local: np.ndarray = field(init=False)
    d_local: np.ndarray = field(init=False)

    # POST-PROCESSING STORAGE
    shear_x: list = field(default_factory=list)
    shear_V: dict = field(default_factory=dict)

    axial_x: list = field(default_factory=list)
    axial_N: list = field(default_factory=list)

    moment_x: list = field(default_factory=list)
    moment_M: dict = field(default_factory=dict)

    torsion_x: list = field(default_factory=list)
    torsion_T: list = field(default_factory=list)

    deflection_position: list = field(default_factory=list)

    deflection_local_x: list = field(default_factory=list)
    deflection_local_y: list = field(default_factory=list)
    deflection_local_z: list = field(default_factory=list)

    deflection_x: list = field(default_factory=list)
    deflection_y: list = field(default_factory=list)
    deflection_z: list = field(default_factory=list)

    # EXTREME VALUES
    max_shear: dict = field(default_factory=dict)
    x_max_shear: dict = field(default_factory=dict)
    min_shear: dict = field(default_factory=dict)
    x_min_shear: dict = field(default_factory=dict)

    max_axial: float = 0.0
    x_max_axial: float = 0.0
    min_axial: float = 0.0
    x_min_axial: float = 0.0

    max_moment: dict = field(default_factory=dict)
    x_max_moment: dict = field(default_factory=dict)
    min_moment: dict = field(default_factory=dict)
    x_min_moment: dict = field(default_factory=dict)

    max_torsion: float = 0.0
    x_max_torsion: float = 0.0
    min_torsion: float = 0.0
    x_min_torsion: float = 0.0

    max_deflection: dict = field(default_factory=dict)
    x_max_deflection: dict = field(default_factory=dict)
    min_deflection: dict = field(default_factory=dict)
    x_min_deflection: dict = field(default_factory=dict)

    # ============================
    # LOAD DEFINITIONS
    # ============================
    
    # POINT LOAD
    def add_point_load(
        self,
        Fx=0.0,
        Fy=0.0,
        Fz=0.0,
        a=0.0,
        Mx=0.0,
        My=0.0,
        Mz=0.0,
        coordinate_system="local"):

        self.member_loads.append({

            "type": "point",

            "coordinate_system": coordinate_system,

            "a": float(a),

            "Fx": float(Fx),
            "Fy": float(Fy),
            "Fz": float(Fz),

            "Mx": float(Mx),
            "My": float(My),
            "Mz": float(Mz)
        })

    # UDL
    def add_udl(
        self,
        wx=0.0,
        wy=0.0,
        wz=0.0,
        coordinate_system="local"):

        self.member_loads.append({

            "type": "udl",
            "coordinate_system": coordinate_system,

            "wx": float(wx),
            "wy": float(wy),
            "wz": float(wz)
        })

    # PARTIAL UDL
    def add_partial_udl(
        self,
        wx=0.0,
        wy=0.0,
        wz=0.0,
        a=0.0,
        b=0.0,
        coordinate_system="local"):

        self.member_loads.append({

            "type": "partial_udl",

            "coordinate_system": coordinate_system,

            "a": float(a),
            "b": float(b),

            "wx": float(wx),
            "wy": float(wy),
            "wz": float(wz)
        })

    # TRAPEZOIDAL LOAD
    def add_trapezoidal_load(
        self,
        wx1=0.0,
        wy1=0.0,
        wz1=0.0,

        wx2=0.0,
        wy2=0.0,
        wz2=0.0,

        coordinate_system="local"):

        self.member_loads.append({

            "type": "trapezoidal",

            "coordinate_system": coordinate_system,

            "wx1": float(wx1),
            "wy1": float(wy1),
            "wz1": float(wz1),

            "wx2": float(wx2),
            "wy2": float(wy2),
            "wz2": float(wz2)
        })

    # SUPPORT DISPLACEMENT
    def add_support_displacement_global(self,
        ux1=0.0, uy1=0.0, uz1=0.0, rx1=0.0, ry1=0.0, rz1=0.0,
        ux2=0.0, uy2=0.0, uz2=0.0, rx2=0.0, ry2=0.0, rz2=0.0):

        self.support_displacements_global = np.array([
        [ux1], [uy1], [uz1], [rx1], [ry1], [rz1],
        [ux2], [uy2], [uz2], [rx2], [ry2], [rz2]], dtype=float)

    def validate_member_loads(self):

        for load in self.member_loads:

            load_type = load["type"]

            if load_type == "point":

                a = load["a"]

                if a < 0 or a > self.L:

                    raise ValueError(
                        f"Point load position "
                        f"a={a} is outside member "
                        f"{self.name} length {self.L}"
                    )


            elif load_type == "partial_udl":

                a = load["a"]
                b = load["b"]

                if a < 0 or b > self.L or b <= a:

                    raise ValueError(
                        f"Invalid partial UDL range "
                        f"a={a}, b={b} "
                        f"for member {self.name} "
                        f"with length {self.L}"
                    )

    # ----------------------------
    # INITIALIZATION
    # ----------------------------
    def initialize(self, nodes):

        self.compute_geometry(nodes)

        self.compute_transformation_matrix()

        self.validate_member_loads()

        self.convert_global_loads_to_local()

        self.compute_local_stiffness()

        self.compute_global_stiffness()

        self.support_displacements_local = (self.T @ self.support_displacements_global)

        self.compute_fixed_end_forces()


    # GEOMETRY
    def compute_geometry(self, nodes):

        if self.start_node not in nodes or self.end_node not in nodes:
            raise ValueError(f"Invalid node in member {self.name}")

        self.start_point = nodes[self.start_node]
        self.end_point = nodes[self.end_node]

        x1, y1, z1 = self.start_point
        x2, y2, z2 = self.end_point

        dx = x2 - x1
        dy = y2 - y1
        dz = z2 - z1

        self.L = np.sqrt(dx**2 + dy**2 + dz**2)
        if self.L == 0:
            raise ValueError("Zero length member detected")

        self.ex = dx / self.L
        self.ey = dy / self.L
        self.ez = dz / self.L

    # LOCAL COORDINATE STIFFNESS 
    def compute_local_stiffness(self):

        E = self.E
        G = self.G
        A = self.A
        I_yy = self.I_yy
        I_zz = self.I_zz
        J = self.J
        L = self.L

        # Axial stiffness
        EA_L = E * A / L

        # Torsional stiffness
        GJ_L = G * J / L

        # Bending about local z-axis (v, theta_z)
        k1_z = 12 * E * I_zz / L**3
        k2_z = 6 * E * I_zz / L**2
        k3_z = 4 * E * I_zz / L
        k4_z = 2 * E * I_zz / L

        # Bending about local y-axis (w, theta_y)
        k1_y = 12 * E * I_yy / L**3
        k2_y = 6 * E * I_yy / L**2
        k3_y = 4 * E * I_yy / L
        k4_y = 2 * E * I_yy / L

        self.k_local = np.array([

            # u1
            [ EA_L,   0,       0,       0,       0,       0,
            -EA_L,   0,       0,       0,       0,       0],

            # v1
            [ 0,      k1_z,    0,       0,       0,       k2_z,
            0,     -k1_z,    0,       0,       0,       k2_z],

            # w1
            [ 0,      0,       k1_y,    0,      -k2_y,    0,
            0,      0,      -k1_y,    0,      -k2_y,    0],

            # theta_x1 (torsion)
            [ 0,      0,       0,       GJ_L,    0,       0,
            0,      0,       0,      -GJ_L,    0,       0],

            # theta_y1
            [ 0,      0,      -k2_y,    0,       k3_y,    0,
            0,      0,       k2_y,    0,       k4_y,    0],

            # theta_z1
            [ 0,      k2_z,    0,       0,       0,       k3_z,
            0,     -k2_z,    0,       0,       0,       k4_z],

            # u2
            [-EA_L,   0,       0,       0,       0,       0,
            EA_L,   0,       0,       0,       0,       0],

            # v2
            [ 0,     -k1_z,    0,       0,       0,      -k2_z,
            0,      k1_z,    0,       0,       0,      -k2_z],

            # w2
            [ 0,      0,      -k1_y,    0,       k2_y,    0,
            0,      0,       k1_y,    0,       k2_y,    0],

            # theta_x2 (torsion)
            [ 0,      0,       0,      -GJ_L,    0,       0,
            0,      0,       0,       GJ_L,    0,       0],

            # theta_y2
            [ 0,      0,      -k2_y,    0,       k4_y,    0,
            0,      0,       k2_y,    0,       k3_y,    0],

            # theta_z2
            [ 0,      k2_z,    0,       0,       0,       k4_z,
            0,     -k2_z,    0,       0,       0,       k3_z]

        ], dtype=float)

    # TRANSFORMATION MATRIX 
    def compute_transformation_matrix(self):
        # NODE COORDINATES
        xi, yi, zi = self.start_point
        xj, yj, zj = self.end_point

        # LOCAL X-AXIS IN GLOBAL COORDINATES
        dx = xj - xi
        dy = yj - yi
        dz = zj - zi

        L = np.sqrt(dx**2 + dy**2 + dz**2)

        if L <= 0:
            raise ValueError("Element length must be greater than zero.")

        local_x = np.array([dx, dy, dz], dtype=float) / L

        # CHOOSE REFERENCE VECTOR
        # Normally use Global Y If local X is too close to Global Y,use Global X instead.

        cos_theta_y = np.dot(local_x, np.array([0.0, 1.0, 0.0]))

        if cos_theta_y**2 > 0.5:
            # Use Global X as reference
            reference = np.array([1.0, 0.0, 0.0])

        else:
            # Use Global Y as reference
            reference = np.array([0.0, 1.0, 0.0])


        # LOCAL Z-AXIS IN GLOBAL COORDINATES
        local_z = np.cross(local_x, reference)

        local_z_norm = np.linalg.norm(local_z)

        if local_z_norm < 1e-12:
            raise ValueError("Unable to construct local coordinate system.")

        local_z = local_z / local_z_norm


        # LOCAL Y-AXIS IN GLOBAL COORDINATES
        local_y = np.cross(local_z, local_x)

        local_y = local_y / np.linalg.norm(local_y)

        # BETA ANGLE ROTATION ABOUT LOCAL X-AXIS
        beta_rad = np.deg2rad(self.beta)

        cos_beta = np.cos(beta_rad)
        sin_beta = np.sin(beta_rad)

        local_y_rotated = (
            cos_beta * local_y
            + sin_beta * local_z)
        
        local_z_rotated = (
            -sin_beta * local_y
            + cos_beta * local_z)

        local_y = local_y_rotated
        local_z = local_z_rotated


        # DIRECTION COSINE MATRIX
        R = np.array([local_x, local_y, local_z])

        # 12 × 12 TRANSFORMATION MATRIX
        T = np.zeros((12, 12))

        T[0:3, 0:3] = R
        T[3:6, 3:6] = R

        T[6:9, 6:9] = R
        T[9:12, 9:12] = R


        # Store results
        self.L = L

        self.local_x = local_x
        self.local_y = local_y
        self.local_z = local_z

        self.R = R
        self.T = T

    # GLOBAL COORDINATE STIFFNESS
    def compute_global_stiffness(self):

        self.k_global = self.T.T @ self.k_local @ self.T

    # GLOBAL → LOCAL MEMBER LOAD CONVERSION
    def convert_global_loads_to_local(self):

        if self.R is None:
            raise ValueError(
                f"Transformation matrix is not available "
                f"for member {self.name}")

        R = self.R

        converted_loads = []

        for load in self.member_loads:

            coordinate_system = load.get("coordinate_system","local").lower()

            # LOCAL LOAD
            if coordinate_system == "local":

                local_load = load.copy()
                local_load["coordinate_system"] = "local"
                converted_loads.append(local_load)
                continue

            # GLOBAL LOAD
            if coordinate_system != "global":

                raise ValueError(
                    f"Invalid coordinate system "
                    f"'{coordinate_system}' "
                    f"for member load on member {self.name}. "
                    f"Use 'local' or 'global'."
                )

            load_type = load["type"]

            # POINT LOAD
            if load_type == "point":
                # Global force vector
                F_global = np.array([
                    load.get("Fx", 0.0),
                    load.get("Fy", 0.0),
                    load.get("Fz", 0.0)
                ], dtype=float)

                # Global moment vector
                M_global = np.array([
                    load.get("Mx", 0.0),
                    load.get("My", 0.0),
                    load.get("Mz", 0.0)
                ], dtype=float)

                # Transform
                F_local = R @ F_global
                M_local = R @ M_global


                local_load = load.copy()

                local_load["coordinate_system"] = "local"

                local_load["Fx"] = float(F_local[0])
                local_load["Fy"] = float(F_local[1])
                local_load["Fz"] = float(F_local[2])

                local_load["Mx"] = float(M_local[0])
                local_load["My"] = float(M_local[1])
                local_load["Mz"] = float(M_local[2])


                converted_loads.append(local_load)

            # UDL
            elif load_type == "udl":

                w_global = np.array([
                    load.get("wx", 0.0),
                    load.get("wy", 0.0),
                    load.get("wz", 0.0)
                ], dtype=float)

                w_local = R @ w_global

                local_load = load.copy()

                local_load["coordinate_system"] = "local"

                local_load["wx"] = float(w_local[0])
                local_load["wy"] = float(w_local[1])
                local_load["wz"] = float(w_local[2])

                converted_loads.append(local_load)

            # PARTIAL UDL
            elif load_type == "partial_udl":

                w_global = np.array([
                    load.get("wx", 0.0),
                    load.get("wy", 0.0),
                    load.get("wz", 0.0)
                ], dtype=float)

                w_local = R @ w_global

                local_load = load.copy()

                local_load["coordinate_system"] = "local"

                local_load["wx"] = float(w_local[0])
                local_load["wy"] = float(w_local[1])
                local_load["wz"] = float(w_local[2])


                converted_loads.append(local_load)

            # TRAPEZOIDAL LOAD
            elif load_type == "trapezoidal":

                # Start intensity
                w1_global = np.array([
                    load.get("wx1", 0.0),
                    load.get("wy1", 0.0),
                    load.get("wz1", 0.0)
                ], dtype=float)

                # End intensity
                w2_global = np.array([
                    load.get("wx2", 0.0),
                    load.get("wy2", 0.0),
                    load.get("wz2", 0.0)
                ], dtype=float)

                # Transform both
                w1_local = R @ w1_global
                w2_local = R @ w2_global


                local_load = load.copy()

                local_load["coordinate_system"] = "local"

                local_load["wx1"] = float(w1_local[0])
                local_load["wy1"] = float(w1_local[1])
                local_load["wz1"] = float(w1_local[2])

                local_load["wx2"] = float(w2_local[0])
                local_load["wy2"] = float(w2_local[1])
                local_load["wz2"] = float(w2_local[2])

                converted_loads.append(local_load)

            # UNKNOWN LOAD TYPE
            else:
                raise ValueError(
                    f"Unsupported member load type "
                    f"'{load_type}' on member {self.name}"
                )

        # Replace original load list
        self.member_loads = converted_loads

    # FIXED END FORCES 
    def compute_fixed_end_forces(self):

        L = self.L

        self.F_Fixed_local = np.zeros((12,1))

        def add_axial_load(Fx1, Fx2):

            self.F_Fixed_local[0, 0] += Fx1
            self.F_Fixed_local[6, 0] += Fx2

        def add_torsional_load(Mx1, Mx2):

            self.F_Fixed_local[3, 0] += Mx1
            self.F_Fixed_local[9, 0] += Mx2

        def add_bending_load(F_plane, direction):

            if direction == "y":
                # Bending in local X-Y plane [v1, rz1, v2, rz2]
                indices = [1, 5, 7, 11]

                for i, index in enumerate(indices):
                    self.F_Fixed_local[index, 0] += F_plane[i, 0]


            elif direction == "z":
                # Bending in local X-Z plane [w1, ry1, w2, ry2]
                indices = [2, 4, 8, 10]

                F_z_plane = np.array([
                    [F_plane[0, 0]],
                    [-F_plane[1, 0]],
                    [F_plane[2, 0]],
                    [-F_plane[3, 0]]])

                for i, index in enumerate(indices):
                    self.F_Fixed_local[index, 0] += F_z_plane[i, 0]


            else:
                raise ValueError(f"Invalid bending direction: {direction}")

        # MEMBER LOAD LOOP
        for load in self.member_loads:

            # POINT LOAD
            if load["type"] == "point":

                a = load["a"]
                b = L - a

                Fx = -load.get("Fx", 0.0)
                Fy = -load.get("Fy", 0.0)
                Fz = -load.get("Fz", 0.0)

                Mx = load.get("Mx", 0.0)
                My = load.get("My", 0.0)
                Mz = load.get("Mz", 0.0)

                # AXIAL COMPONENT
                Fx1 = Fx * b / L
                Fx2 = Fx * a / L

                add_axial_load(Fx1, Fx2)

                # LOCAL Y FORCE
                if abs(Fy) > 0.0:

                    F_y = np.array([
                        [Fy*b**2*(3*a+b)/L**3],
                        [Fy*a*b**2/L**2],
                        [Fy*a**2*(a+3*b)/L**3],
                        [-Fy*a**2*b/L**2]
                    ])

                    add_bending_load(F_y, "y")

                # LOCAL Z FORCE
                if abs(Fz) > 0.0:

                    F_z = np.array([
                        [Fz*b**2*(3*a+b)/L**3],
                        [Fz*a*b**2/L**2],
                        [Fz*a**2*(a+3*b)/L**3],
                        [-Fz*a**2*b/L**2]
                    ])

                    add_bending_load(F_z, "z")

                # Torsion about local x
                if abs(Mx) > 0.0:

                    Mx1 = -Mx * b / L
                    Mx2 = -Mx * a / L

                    add_torsional_load(Mx1, Mx2)

                # Bending moment about local y
                if abs(My) > 0.0:

                    M = My

                    F = np.array([
                        [-6*M*a*b/L**3],
                        [M*b*(2*a-b)/L**2],
                        [6*M*a*b/L**3],
                        [M*a*(2*b-a)/L**2]])

                    add_bending_load(F, "z")

                # Bending moment about local z
                if abs(Mz) > 0.0:

                    M = Mz

                    F = np.array([
                        [-6*M*a*b/L**3],
                        [M*b*(2*a-b)/L**2],
                        [6*M*a*b/L**3],
                        [M*a*(2*b-a)/L**2]])

                    add_bending_load(F, "y")

            # UDL
            elif load["type"] == "udl":

                wx = -load.get("wx", 0.0)
                wy = -load.get("wy", 0.0)
                wz = -load.get("wz", 0.0)

                # AXIAL UDL
                if abs(wx) > 0.0:

                    Fx1 = wx * L / 2
                    Fx2 = wx * L / 2

                    add_axial_load(Fx1, Fx2)

                # LOCAL Y UDL
                if abs(wy) > 0.0:

                    F_y = np.array([
                        [wy*L/2],
                        [wy*L**2/12],
                        [wy*L/2],
                        [-wy*L**2/12]])

                    add_bending_load(F_y, "y")

                # LOCAL Z UDL
                if abs(wz) > 0.0:

                    F_z = np.array([
                        [wz*L/2],
                        [wz*L**2/12],
                        [wz*L/2],
                        [-wz*L**2/12]])

                    add_bending_load(F_z, "z")

            # PARTIAL UDL
            elif load["type"] == "partial_udl":

                a = load["a"]
                b = load["b"]

                wx = -load.get("wx", 0.0)
                wy = -load.get("wy", 0.0)
                wz = -load.get("wz", 0.0)

                # AXIAL PARTIAL UDL
                if abs(wx) > 0.0:

                    Fx1 = (wx * (b - a) * (2*L - a - b) / (2*L))
                    Fx2 = (wx * (b**2 - a**2) / (2*L))

                    add_axial_load(Fx1, Fx2)

                # BENDING Y
                if abs(wy) > 0.0:

                    W = wy * (b - a)

                    R1 = (wy / (2 * L**3)) * (
                        2 * L**3 * (b-a)
                        - 2 * L * (b**3-a**3)
                        + (b**4-a**4)
                    )

                    R2 = W - R1

                    M1 = (wy / (12 * L**2)) * (
                        b**2 * (6*L**2 - 8*L*b + 3*b**2)
                        -
                        a**2 * (6*L**2 - 8*L*a + 3*a**2)
                    )

                    M2 = (-wy / (12 * L**2)) * (
                        b**3 * (4*L - 3*b)
                        -
                        a**3 * (4*L - 3*a)
                    )

                    F_y = np.array([
                        [R1],
                        [M1],
                        [R2],
                        [M2]
                    ])

                    add_bending_load(F_y, "y")

                # BENDING Z
                if abs(wz) > 0.0:

                    W = wz * (b - a)

                    R1 = (wz / (2 * L**3)) * (
                        2 * L**3 * (b-a)
                        - 2 * L * (b**3-a**3)
                        + (b**4-a**4)
                    )

                    R2 = W - R1

                    M1 = (wz / (12 * L**2)) * (
                        b**2 * (6*L**2 - 8*L*b + 3*b**2)
                        -
                        a**2 * (6*L**2 - 8*L*a + 3*a**2)
                    )

                    M2 = (-wz / (12 * L**2)) * (
                        b**3 * (4*L - 3*b)
                        -
                        a**3 * (4*L - 3*a)
                    )

                    F_z = np.array([
                        [R1],
                        [M1],
                        [R2],
                        [M2]
                    ])

                    add_bending_load(F_z, "z")

            # TRAPEZOIDAL LOAD
            elif load["type"] == "trapezoidal":

                wx1 = -load.get("wx1", 0.0)
                wy1 = -load.get("wy1", 0.0)
                wz1 = -load.get("wz1", 0.0)

                wx2 = -load.get("wx2", 0.0)
                wy2 = -load.get("wy2", 0.0)
                wz2 = -load.get("wz2", 0.0)

                # AXIAL
                if abs(wx1) > 0.0 or abs(wx2) > 0.0:

                    Fx1 = L/6 * (2*wx1 + wx2)
                    Fx2 = L/6 * (wx1 + 2*wx2)

                    add_axial_load(Fx1, Fx2)

                # LOCAL Y
                if abs(wy1) > 0.0 or abs(wy2) > 0.0:

                    F_y = np.array([
                        [(L/20)*(7*wy1 + 3*wy2)],
                        [(L**2/60)*(3*wy1 + 2*wy2)],
                        [(L/20)*(3*wy1 + 7*wy2)],
                        [-(L**2/60)*(2*wy1 + 3*wy2)]
                    ])

                    add_bending_load(F_y, "y")

                # LOCAL Z
                if abs(wz1) > 0.0 or abs(wz2) > 0.0:

                    F_z = np.array([
                        [(L/20)*(7*wz1 + 3*wz2)],
                        [(L**2/60)*(3*wz1 + 2*wz2)],
                        [(L/20)*(3*wz1 + 7*wz2)],
                        [-(L**2/60)*(2*wz1 + 3*wz2)]
                    ])

                    add_bending_load(F_z, "z")


        # SUPPORT DISPLACEMENT CONTRIBUTION
        if np.any(self.support_displacements_local):

            F_support_local = self.k_local @ self.support_displacements_local

            self.F_Fixed_local += F_support_local

        #Transform to global coordinates
        self.F_Fixed_Global = self.T.T @ self.F_Fixed_local

        self.f_memb_force_local = np.zeros((12,1))
        self.d_local = np.zeros((12,1))


    # ============================
    # POST-PROCESSING 
    # ============================

    # SHEAR FORCE DISTRIBUTION
    def compute_shear_distribution(self,n_points=40):

        L = self.L
        x_vals = np.linspace(0,L,n_points)

        # LOCAL MEMBER END FORCES
        # Local Y direction
        V1 = {
            "y": self.f_memb_force_local[1, 0],
            "z": self.f_memb_force_local[2, 0]}

        # End shear force at Node 2
        V2 = {
            "y": self.f_memb_force_local[7, 0],
            "z": self.f_memb_force_local[8, 0]}

        for direction in ("y", "z"):

            shear_values = []
        
            for x in x_vals:
                v = V1[direction]

                # UDL
                for load in self.member_loads:

                    if direction == "y":
                        force_component = "Fy"
                        intensity_component = "wy"
                        intensity_start = "wy1"
                        intensity_end = "wy2"

                    elif direction == "z":
                        force_component = "Fz"
                        intensity_component = "wz"
                        intensity_start = "wz1"
                        intensity_end = "wz2"

                    else:
                        continue

                    # UDL
                    if load["type"] == "udl":

                        w = -load.get(intensity_component, 0.0)
                        v -= w*x

                    # PARTIAL UDL
                    elif load["type"] == "partial_udl":

                        w = -load.get(intensity_component, 0.0)

                        a = load["a"]
                        b = load["b"]

                        if x <= a:
                            pass

                        elif x <= b:
                            v -= w*(x-a)

                        else:
                            v -= w*(b-a)

                    # POINT
                    elif load["type"] == "point":

                        P = -load.get(force_component, 0.0)
                        a = load["a"]

                        if x >= a:
                            v -= P

                    # TRAPEZOIDAL
                    elif load["type"] == "trapezoidal":

                        w1 = -load.get(intensity_start, 0.0)
                        w2 = -load.get(intensity_end, 0.0)

                        v -= (w1*x + (w2-w1)*x**2/(2*L))

                shear_values.append(v)

            V_arr = np.array(shear_values)

            self.shear_V[direction] = shear_values

            self.max_shear[direction] = np.max(V_arr)
            self.x_max_shear[direction] = x_vals[np.argmax(V_arr)]

            self.min_shear[direction] = np.min(V_arr)
            self.x_min_shear[direction] = x_vals[np.argmin(V_arr)]

        self.shear_x = x_vals.tolist()

    # MOMENT DISTRIBUTION
    def compute_moment_distribution(self, n_points=40):

        L = self.L
        x_vals = np.linspace(0, L, n_points)

        # Shear force which produces moment about local Y
        V_y_axis = self.f_memb_force_local[2, 0]
        # Shear force which produces moment about local Z
        V_z_axis = self.f_memb_force_local[1, 0]
        # Moment about local Y
        M_y_axis = self.f_memb_force_local[4, 0]
        # Moment about local Z
        M_z_axis = self.f_memb_force_local[5, 0]

        My_values = []

        for x in x_vals:

            # Starting internal moment
            m = M_y_axis + V_y_axis * x

            # MEMBER LOADS
            for load in self.member_loads:
                # UDL
                if load["type"] == "udl":

                    wz = -load.get("wz", 0.0)
                    m -= wz * x**2 / 2

                # PARTIAL UDL
                elif load["type"] == "partial_udl":

                    wz = -load.get("wz", 0.0)

                    a = load["a"]
                    b = load["b"]

                    if x <= a:
                        # Load has not started
                        pass

                    elif x <= b:
                        # Portion of load has been passed
                        m -= wz * (x - a)**2 / 2

                    else:
                        # Entire partial UDL has been passed
                        m -= (wz * (b - a) * (x - (a + b) / 2))

                # POINT LOAD
                elif load["type"] == "point":

                    Fz = -load.get("Fz", 0.0)
                    a = load["a"]

                    # Transverse force Fz
                    if x >= a:
                        m -= Fz * (x - a)

                    # Concentrated moment My
                    if abs(load.get("My", 0.0)) > 1e-12:

                        if x >= a:
                            m += load["My"]

                # TRAPEZOIDAL LOAD
                elif load["type"] == "trapezoidal":

                    wz1 = -load.get("wz1", 0.0)
                    wz2 = -load.get("wz2", 0.0)

                    m -= (wz1 * x**2 / 2 +
                        (wz2 - wz1) * x**3 / (6 * L))

            My_values.append(m)

        # M_z
        Mz_values = []

        for x in x_vals:

            # Starting internal moment
            m = -M_z_axis + V_z_axis * x

            # MEMBER LOADS
            for load in self.member_loads:

                # UDL
                if load["type"] == "udl":

                    wy = -load.get("wy", 0.0)
                    m -= wy * x**2 / 2

                # PARTIAL UDL
                elif load["type"] == "partial_udl":

                    wy = -load.get("wy", 0.0)

                    a = load["a"]
                    b = load["b"]

                    if x <= a:
                        pass

                    elif x <= b:
                        m -= wy * (x - a)**2 / 2

                    else:
                        m -= (wy * (b - a) * (x - (a + b) / 2))

                # POINT LOAD
                elif load["type"] == "point":

                    Fy = -load.get("Fy", 0.0)
                    a = load["a"]

                    # Transverse force Fy
                    if x >= a:
                        m -= Fy * (x - a)

                    # Concentrated moment Mz
                    if abs(load.get("Mz", 0.0)) > 1e-12:

                        if x >= a:
                            m += load["Mz"]

                # TRAPEZOIDAL LOAD
                elif load["type"] == "trapezoidal":

                    wy1 = -load.get("wy1", 0.0)
                    wy2 = -load.get("wy2", 0.0)

                    m -= (wy1 * x**2 / 2 +
                        (wy2 - wy1) * x**3 / (6 * L))

            Mz_values.append(m)

        # STORE RESULTS
        self.moment_M = {
            "y": My_values,
            "z": Mz_values}

        self.moment_x = x_vals.tolist()

        # MAX / MIN VALUES
        My_arr = np.array(My_values)
        Mz_arr = np.array(Mz_values)

        self.max_moment = {
            "y": np.max(My_arr),
            "z": np.max(Mz_arr)}

        self.min_moment = {
            "y": np.min(My_arr),
            "z": np.min(Mz_arr)}

        self.x_max_moment = {
            "y": x_vals[np.argmax(My_arr)],
            "z": x_vals[np.argmax(Mz_arr)]}

        self.x_min_moment = {
            "y": x_vals[np.argmin(My_arr)],
            "z": x_vals[np.argmin(Mz_arr)]}

    # AXIAL FORCE DISTRIBUTION
    def compute_axial_force_distribution(self, n_points=40):

        L = self.L
        x_vals = np.linspace(0, L, n_points)

        # Axial force at Node 1
        N1 = self.f_memb_force_local[0, 0]
        N2 = self.f_memb_force_local[6, 0]

        axial_values = []

        for x in x_vals:

            n = N1

            for load in self.member_loads:

                # POINT LOAD
                if load["type"] == "point":

                    Fx = -load.get("Fx", 0.0)
                    a = load["a"]

                    if x >= a:
                        n -= Fx


                # UDL
                elif load["type"] == "udl":

                    wx = -load.get("wx", 0.0)

                    n -= wx * x


                # PARTIAL UDL
                elif load["type"] == "partial_udl":

                    wx = -load.get("wx", 0.0)
                    a = load["a"]
                    b = load["b"]

                    if x <= a:
                        pass

                    elif x <= b:
                        n -= wx * (x - a)

                    else:
                        n -= wx * (b - a)


                # TRAPEZOIDAL LOAD
                elif load["type"] == "trapezoidal":

                    wx1 = -load.get("wx1", 0.0)
                    wx2 = -load.get("wx2", 0.0)

                    n -= (
                        wx1 * x
                        + (wx2 - wx1) * x**2 / (2 * L)
                    )


            axial_values.append(n)

        axial_values[-1] += N2

        self.axial_x = x_vals.tolist()
        self.axial_N = axial_values

        N_arr = np.array(axial_values)

        self.max_axial = np.max(N_arr)
        self.x_max_axial = x_vals[np.argmax(N_arr)]

        self.min_axial = np.min(N_arr)
        self.x_min_axial = x_vals[np.argmin(N_arr)]

    # TORSION DISTRIBUTION
    def compute_torsion_distribution(self, n_points=40):

        L = self.L
        x_vals = np.linspace(0, L, n_points)

        # Torsional moment at Node 1
        T1 = self.f_memb_force_local[3, 0]

        torsion_values = []

        for x in x_vals:

            t = T1

            for load in self.member_loads:

                if load["type"] == "point":

                    Mx = load.get("Mx", 0.0)

                    if abs(Mx) < 1e-12:
                        continue

                    a = load["a"]

                    if x >= a:
                        t += Mx

            torsion_values.append(t)

        self.torsion_x = x_vals.tolist()
        self.torsion_T = torsion_values

        T_arr = np.array(torsion_values)

        self.max_torsion = np.max(T_arr)
        self.x_max_torsion = x_vals[np.argmax(T_arr)]

        self.min_torsion = np.min(T_arr)
        self.x_min_torsion = x_vals[np.argmin(T_arr)]

# ----------------------------
# MEMBER INITIALIZATION
# ----------------------------
def initialize_members(members, nodes):
    for m in members:
        m.initialize(nodes)

# ----------------------------
# GLOBAL FORCE VECTOR
# ----------------------------
def assemble_force_vector(nodes, members, F_node):
    F = np.zeros((6*len(nodes),1))

    # Node loads
    F += F_node

    # Member loads
    for m in members:
        dofs = [
            6 * m.start_node,
            6 * m.start_node + 1,
            6 * m.start_node + 2,
            6 * m.start_node + 3,
            6 * m.start_node + 4,
            6 * m.start_node + 5,

            6 * m.end_node,
            6 * m.end_node + 1,
            6 * m.end_node + 2,
            6 * m.end_node + 3,
            6 * m.end_node + 4,
            6 * m.end_node + 5
        ]

        for a in range(12):
            F[dofs[a], 0] -= m.F_Fixed_Global[a, 0]

    return F


# ----------------------------
# GLOBAL STIFFNESS MATRIX
# ----------------------------
def assemble_stiffness(nodes, members):
    n_nodes = len(nodes)
    K_global = np.zeros((6*n_nodes, 6*n_nodes))

    for m in members:
        dofs = [
            6 * m.start_node,
            6 * m.start_node + 1,
            6 * m.start_node + 2,
            6 * m.start_node + 3,
            6 * m.start_node + 4,
            6 * m.start_node + 5,

            6 * m.end_node,
            6 * m.end_node + 1,
            6 * m.end_node + 2,
            6 * m.end_node + 3,
            6 * m.end_node + 4,
            6 * m.end_node + 5
        ]

        for a in range(12):
            for b in range(12):
                K_global[dofs[a], dofs[b]] += m.k_global[a, b]

    return K_global


# ----------------------------
# SOLVER
# ----------------------------
def solve_system(K_global, F, fixed_dofs):

    n = len(F)

    all_dofs = np.arange(n)
    fixed_dofs = fixed_dofs.flatten()
    free_dofs = np.setdiff1d(all_dofs, fixed_dofs)

    K_red = K_global[np.ix_(free_dofs, free_dofs)]
    F_red = F[free_dofs]

    try:
        D_red = np.linalg.solve(K_red, F_red)
    except np.linalg.LinAlgError:
        raise ValueError("Structure unstable (insufficient constraints) or mechanism formed")

    D = np.zeros((n,1))
    D[free_dofs] = D_red

    R = (K_global @ D) - F

    return D, R, K_red, F_red


# ----------------------------
# MEMBER FORCES
# ----------------------------
def compute_member_forces(members, D):

    for m in members:
        d_Global_Coo = np.array([
            D[6 * m.start_node + 0, 0],
            D[6 * m.start_node + 1, 0],
            D[6 * m.start_node + 2, 0],
            D[6 * m.start_node + 3, 0],
            D[6 * m.start_node + 4, 0],
            D[6 * m.start_node + 5, 0],

            D[6 * m.end_node + 0, 0],
            D[6 * m.end_node + 1, 0],
            D[6 * m.end_node + 2, 0],
            D[6 * m.end_node + 3, 0],
            D[6 * m.end_node + 4, 0],
            D[6 * m.end_node + 5, 0]
        ]).reshape(12, 1)

        # CONVERT → LOCAL
        d_local = m.T @ d_Global_Coo

        m.d_local = d_local


        m.f_memb_force_local = (m.k_local @ d_local) + m.F_Fixed_local
        m.f_memb_force_local = np.round(m.f_memb_force_local, 3)


# ----------------------------
# Support Settlement
# ----------------------------
def build_display_displacements(D, support_settlements):

    D_display = D.copy()

    for node_id, settlement in support_settlements.items():

        ux, uy, uz, rx, ry, rz = settlement

        D_display[6 * node_id + 0, 0] += ux
        D_display[6 * node_id + 1, 0] += uy
        D_display[6 * node_id + 2, 0] += uz
        D_display[6 * node_id + 3, 0] += rx
        D_display[6 * node_id + 4, 0] += ry
        D_display[6 * node_id + 5, 0] += rz

    return D_display

def assign_support_displacements(members, support_settlements):

    for m in members:

        ux1 = uy1 = uz1 = 0.0
        rx1 = ry1 = rz1 = 0.0

        ux2 = uy2 = uz2 = 0.0
        rx2 = ry2 = rz2 = 0.0

        if m.start_node in support_settlements:
            ux1, uy1, uz1, rx1, ry1, rz1 = support_settlements[m.start_node]

        if m.end_node in support_settlements:
            ux2, uy2, uz2, rx2, ry2, rz2 = support_settlements[m.end_node]

        m.add_support_displacement_global(
            ux1, uy1, uz1,
            rx1, ry1, rz1,

            ux2, uy2, uz2,
            rx2, ry2, rz2
        )


# ----------------------------
# Deflection Diagram
# ----------------------------
def create_local_refined_member(original_member, n_divisions=30):

    L = original_member.L

    # Start with equal divisions
    x_refined_values = list(np.linspace(0.0, L, n_divisions + 1))

    # Add locations where load behaviour changes
    for load in original_member.member_loads:

        if load["type"] == "point":
            x_refined_values.append(load["a"])

        elif load["type"] == "partial_udl":
            x_refined_values.append(load["a"])
            x_refined_values.append(load["b"])

    # Remove duplicates and sort
    x_refined_values = sorted(set(round(x, 12) for x in x_refined_values))

    # Temporary node coordinates
    refined_nodes = {
        i: (x, 0.0, 0.0)
        for i, x in enumerate(x_refined_values)}

    # Temporary Member objects
    refined_members = []

    for i in range(len(x_refined_values) - 1):

        m = Member(
            name=i,
            start_node=i,
            end_node=i + 1,

            E=original_member.E,
            G=original_member.G,

            A=original_member.A,

            I_yy=original_member.I_yy,
            I_zz=original_member.I_zz,
            J=original_member.J,

            beta=original_member.beta
        )

        refined_members.append(m)

    return x_refined_values, refined_nodes, refined_members

def transfer_local_refined_loads(original_member, refined_members, refined_x):

    L = original_member.L

    # Refined nodal global loads
    F_refined_node = np.zeros((6 * len(refined_x), 1))

    for load in original_member.member_loads:

        load_type = load["type"]

        if load_type == "udl":

            wx = load.get("wx", 0.0)
            wy = load.get("wy", 0.0)
            wz = load.get("wz", 0.0)

            for m in refined_members:

                m.add_udl(
                    wx=wx,
                    wy=wy,
                    wz=wz,
                    coordinate_system="local")


        elif load_type == "partial_udl":

            wx = load.get("wx", 0.0)
            wy = load.get("wy", 0.0)
            wz = load.get("wz", 0.0)

            a = load["a"]
            b = load["b"]


            for i, m in enumerate(refined_members):

                x1 = refined_x[i]
                x2 = refined_x[i + 1]

                if x1 >= a and x2 <= b:

                    m.add_udl(
                        wx=wx,
                        wy=wy,
                        wz=wz,
                        coordinate_system="local")

        elif load_type == "trapezoidal":

            wx1 = load.get("wx1", 0.0)
            wy1 = load.get("wy1", 0.0)
            wz1 = load.get("wz1", 0.0)

            wx2 = load.get("wx2", 0.0)
            wy2 = load.get("wy2", 0.0)
            wz2 = load.get("wz2", 0.0)


            for i, m in enumerate(refined_members):

                x1 = refined_x[i]
                x2 = refined_x[i + 1]

                r1 = x1 / L
                r2 = x2 / L

                # Interpolate each component
                we_x1 = wx1 + (wx2 - wx1) * r1
                we_x2 = wx1 + (wx2 - wx1) * r2

                we_y1 = wy1 + (wy2 - wy1) * r1
                we_y2 = wy1 + (wy2 - wy1) * r2

                we_z1 = wz1 + (wz2 - wz1) * r1
                we_z2 = wz1 + (wz2 - wz1) * r2

                m.add_trapezoidal_load(
                    wx1=we_x1,
                    wy1=we_y1,
                    wz1=we_z1,

                    wx2=we_x2,
                    wy2=we_y2,
                    wz2=we_z2,

                    coordinate_system="local")

        elif load_type == "point":

            a = load["a"]

            node_index = min(range(len(refined_x)),
                key=lambda i: abs(refined_x[i] - a))

            if abs(refined_x[node_index] - a) > 1e-8:
                raise ValueError(
                    f"Point load location {a} "
                    "does not match refined node.")

            # FORCE COMPONENTS
            F_refined_node[
                6 * node_index + 0, 0
            ] += load.get("Fx", 0.0)

            F_refined_node[
                6 * node_index + 1, 0
            ] += load.get("Fy", 0.0)

            F_refined_node[
                6 * node_index + 2, 0
            ] += load.get("Fz", 0.0)

            # MOMENT COMPONENTS
            F_refined_node[
                6 * node_index + 3, 0
            ] += load.get("Mx", 0.0)

            F_refined_node[
                6 * node_index + 4, 0
            ] += load.get("My", 0.0)

            F_refined_node[
                6 * node_index + 5, 0
            ] += load.get("Mz", 0.0)

    return F_refined_node

def calculate_refined_member_deflection(original_member, D_display, n_divisions=30):

    refined_x, refined_nodes, refined_members = create_local_refined_member(original_member, n_divisions)

    F_refined_node = transfer_local_refined_loads(original_member, refined_members, refined_x)


    d_global = np.array([
        D_display[6 * original_member.start_node + 0, 0],
        D_display[6 * original_member.start_node + 1, 0],
        D_display[6 * original_member.start_node + 2, 0],
        D_display[6 * original_member.start_node + 3, 0],
        D_display[6 * original_member.start_node + 4, 0],
        D_display[6 * original_member.start_node + 5, 0],

        D_display[6 * original_member.end_node + 0, 0],
        D_display[6 * original_member.end_node + 1, 0],
        D_display[6 * original_member.end_node + 2, 0],
        D_display[6 * original_member.end_node + 3, 0],
        D_display[6 * original_member.end_node + 4, 0],
        D_display[6 * original_member.end_node + 5, 0]

    ]).reshape(12, 1)

    d_local = original_member.T @ d_global

    last_node = len(refined_nodes) - 1

    support_displacements = {

        0: (float(d_local[0, 0]),     # ux
            float(d_local[1, 0]),     # uy
            float(d_local[2, 0]),     # uz

            float(d_local[3, 0]),     # rx
            float(d_local[4, 0]),     # ry
            float(d_local[5, 0])),    # rz


        last_node: (
            float(d_local[6, 0]),     # ux
            float(d_local[7, 0]),     # uy
            float(d_local[8, 0]),     # uz

            float(d_local[9, 0]),     # rx
            float(d_local[10, 0]),    # ry
            float(d_local[11, 0]))}   # rz

    fixed_dofs = np.array([
        [0], [1], [2], [3], [4], [5],

        [6 * last_node + 0],
        [6 * last_node + 1],
        [6 * last_node + 2],
        [6 * last_node + 3],
        [6 * last_node + 4],
        [6 * last_node + 5]])

    assign_support_displacements(refined_members, support_displacements)

    initialize_members(refined_members, refined_nodes)

    F = assemble_force_vector(refined_nodes, refined_members,F_refined_node)

    K_global = assemble_stiffness(refined_nodes, refined_members)

    D, R, K_red, F_red = solve_system(K_global, F, fixed_dofs)

    D_display_refined = build_display_displacements(D,support_displacements)


    deflection_position = []
    deflection_local_x = []
    deflection_local_y = []
    deflection_local_z = []

    deflection_global_x = []
    deflection_global_y = []
    deflection_global_z = []

    x1, y1, z1 = original_member.start_point

    # LOCAL → GLOBAL TRANSFORMATION R is cos matrix
    R_local_to_global = original_member.R.T

    for i, x in enumerate(refined_x):

        u_local = np.array([
            D_display_refined[6 * i + 0, 0],
            D_display_refined[6 * i + 1, 0],
            D_display_refined[6 * i + 2, 0]])

        # Store local transverse displacement
        deflection_local_x.append(u_local[0])
        deflection_local_y.append(u_local[1])
        deflection_local_z.append(u_local[2])

        # Local displacement → global displacement
        u_global = (R_local_to_global @ u_local)

        # Original point in global coordinates
        original_position = np.array([x1, y1, z1
            ]) + x * original_member.local_x

        # Actual displaced global coordinates
        displaced_position = (original_position + u_global)

        deflection_position.append(x)

        deflection_global_x.append(displaced_position[0])
        deflection_global_y.append(displaced_position[1])
        deflection_global_z.append(displaced_position[2])

    original_member.deflection_position = deflection_position

    original_member.deflection_local_x = deflection_local_x
    original_member.deflection_local_y = deflection_local_y
    original_member.deflection_local_z = deflection_local_z

    original_member.deflection_x = deflection_global_x
    original_member.deflection_y = deflection_global_y
    original_member.deflection_z = deflection_global_z

    for direction, values in {
        "y": deflection_local_y,
        "z": deflection_local_z}.items():

        values_arr = np.array(values)

        original_member.max_deflection[direction] = float(np.max(values_arr))

        original_member.x_max_deflection[direction] = float(refined_x[np.argmax(values_arr)])

        original_member.min_deflection[direction] = float(np.min(values_arr))

        original_member.x_min_deflection[direction] = float(refined_x[np.argmin(values_arr)])

# ----------------------------
# MAIN ANALYSIS FUNCTION
# ----------------------------
def run_analysis(nodes, members, F_node, fixed_dofs, support_settlements={}):

    # Step 0: assign support displacements
    assign_support_displacements(members, support_settlements)

    # Step 1: initialize members
    initialize_members(members, nodes)

    # Step 2: force vector
    F = assemble_force_vector(nodes, members, F_node)

    # Step 3: stiffness matrix
    K_global = assemble_stiffness(nodes, members)

    # Step 4: solve
    D, R, K_red, F_red = solve_system(K_global, F, fixed_dofs)

    D_display = build_display_displacements(D,support_settlements)

    # Step 5: member forces
    compute_member_forces(members, D)

    # Step 6: post-process members
    for m in members:

        m.compute_axial_force_distribution()

        m.compute_shear_distribution()

        m.compute_moment_distribution()

        m.compute_torsion_distribution()

        calculate_refined_member_deflection(m, D_display, n_divisions=30)

    # return everything
    return {
        "K_global": K_global,
        "K_reduced": K_red,
        "F_reduced": F_red,
        "displacements": D_display,
        "reactions": R,
        "members": members,
       
    }

#----------------------------
# Run analysis 
#----------------------------

if __name__ == "__main__":

    # Nodes
    nodes = {
        0: (0, 0, 0),
        1: (1, 0, 0),
        2: (2, 0, 0),
        3: (3, 0, 0),
        4: (5, 0, 0),
    }

    # Members

    E = 1
    G = 1
    A = 1

    I_yy = 1
    I_zz = 1

    J = 1
  
    m1=Member(1, 0, 1, E, G, A, I_yy, I_zz, J)
    m2=Member(2, 1, 2, E, G, A, I_yy, I_zz, J)
    m3=Member(3, 2, 3, E, G, A, I_yy, I_zz, J)
    m4=Member(4, 3, 4, E, G, A, I_yy, I_zz, J)
    
    m4.add_udl(
        wx=0.0,
        wy=-6.0,
        wz=0.0
    )

    members = [m1, m2, m3, m4]

    # Loads
    F_node = np.zeros((6 * len(nodes), 1))

    F_node[6*1 + 1] = -16   # v direction

    # Supports
    fixed_dofs = np.array([
    [0], [1], [2], [3], [4], [5],         # Node 0 → fixed
    [12], [13], [14],                     # Node 2 → roller (u,v fixed)
    [18], [19], [20],                     # Node 3 → roller
    [24], [25], [26], [27], [28], [29]    # Node 4 → fixed
    ])

    # support_settlements = {0: (0.0, -0.02, 0.0), 2: (0.0, -0.01, 0.0)}

    # Run
    result = run_analysis(nodes, members, F_node, fixed_dofs)

    print("Displacements:\n", result["displacements"])
    print("Reactions:\n", result["reactions"])

    for m in result["members"]:
        print(f"Member {m.start_node}-{m.end_node} force:\n", m.f_memb_force_local)