def calc_steel_stress(fy, strain):
    Es = 200000  # Modulus of elasticity of steel in MPa
    if strain <= 0.8 * 0.87 * fy / Es:

        return Es * strain
    
    elif strain <= (0.87 * fy / Es) + 0.002:

        a = -(0.2 * 0.87 * fy) / (((0.2*0.87*fy/Es)+0.002)**2)
        b = -2*a*((0.87*fy/Es)+0.002)
        c = 0.87 * fy + a*((0.87*fy/Es)+0.002)**2

        return a * strain**2 + b * strain + c
    
    else:

        return 0.87 * fy

def calc_concrete_stress(fck, strain):
    if strain <= 0.002:

        a = -0.446 * fck / 0.002**2
        b = 2 * 0.446 * fck / 0.002

        return a * strain**2 + b * strain
    
    else:

        return 0.446 * fck

if __name__ == "__main__":
    fy = 500
    strain = 0.004
    fck = 20
    steel_stress = calc_steel_stress(fy, strain)
    concrete_stress = calc_concrete_stress(fck, strain)
    print(f"Steel stress: {steel_stress} MPa")
    print(f"Concrete stress: {concrete_stress} MPa")