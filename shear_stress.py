
# ---------------------------------------
# τc table 19 of IS 456:2000 
# ---------------------------------------
TAU_C_TABLE = {

0.15:{15:0.28,20:0.28,25:0.29,30:0.29,35:0.29,40:0.30},
0.25:{15:0.35,20:0.36,25:0.36,30:0.37,35:0.37,40:0.38},
0.50:{15:0.46,20:0.48,25:0.49,30:0.50,35:0.50,40:0.51},
0.75:{15:0.54,20:0.56,25:0.57,30:0.59,35:0.59,40:0.60},
1.00:{15:0.60,20:0.62,25:0.64,30:0.66,35:0.67,40:0.68},
1.25:{15:0.64,20:0.67,25:0.70,30:0.71,35:0.73,40:0.74},
1.50:{15:0.68,20:0.72,25:0.74,30:0.76,35:0.78,40:0.79},
1.75:{15:0.71,20:0.75,25:0.78,30:0.80,35:0.82,40:0.84},
2.00:{15:0.71,20:0.79,25:0.82,30:0.84,35:0.86,40:0.88},
2.25:{15:0.71,20:0.81,25:0.85,30:0.88,35:0.90,40:0.92},
2.50:{15:0.71,20:0.82,25:0.88,30:0.91,35:0.93,40:0.95},
2.75:{15:0.71,20:0.82,25:0.90,30:0.94,35:0.96,40:0.98},
3.00:{15:0.71,20:0.82,25:0.92,30:0.96,35:0.99,40:1.01}

}

# ---------------------------------------
# τc table 20 of IS 456:2000 (max shear stress)
# ---------------------------------------
MAX_SHEAR_STRESS = {
    15:2.5,
    20:2.8,
    25:3.1,
    30:3.5,
    35:3.7,
    40:4.0

}

# ---------------------------------------
# Get τc value by interpolation
# ---------------------------------------
def get_tau_c(ast_percent, fck):

    # Use M40 column for fck ≥ 40
    if fck >= 40:
        grade = 40
    else:
        grade = int(fck)

    ast_values = sorted(TAU_C_TABLE.keys())

    if grade not in TAU_C_TABLE[ast_values[0]]:
        raise ValueError(f"Concrete grade {grade} not found")

    # Clamp Ast% outside limits
    if ast_percent <= 0.15:
        ast_percent = 0.15
    elif ast_percent >= 3.0:
        ast_percent = 3.0

    for i in range(len(ast_values)-1):

        if ast_values[i] <= ast_percent <= ast_values[i+1]:

            x1 = ast_values[i]
            x2 = ast_values[i+1]

            y1 = TAU_C_TABLE[x1][grade]
            y2 = TAU_C_TABLE[x2][grade]

            # Linear interpolation
            tau_c = y1 + (y2-y1)*(ast_percent-x1)/(x2-x1)

            break

    tau_c_max = MAX_SHEAR_STRESS[grade]

    return tau_c, tau_c_max


# ---------------------------------------
# Example usage (RUN THIS PART)
# ---------------------------------------

if __name__ == "__main__":

    # Inputs (from your beam design)
    Ast_percent =0.11    # %
    concrete_grade = 45

        # Get τc
    tau_c,tau_c_max = get_tau_c(Ast_percent, concrete_grade)
    print("===================================")
    print(" SHEAR STRESS (τc) CALCULATION ")
    print("===================================")
    print(f"Ast %           : {Ast_percent}")
    print(f"Concrete grade  : {concrete_grade}")
    print(f"τc (N/mm²)      : {tau_c:.3f}")
    print(f"τc_max (N/mm²)      : {tau_c_max:.3f}")
