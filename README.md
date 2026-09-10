# 🏗️ Frame Structural Analyzer

A browser-based **2D Frame Structural Analysis** application for modeling, analyzing, visualizing, and reporting structural behavior.

The application uses the **Direct Stiffness Method** for frame analysis and provides an interactive interface for structural modeling, result visualization, and report generation.

---

## 📌 Project Overview

Frame Structural Analyzer provides a complete workflow from structural modeling to analysis and reporting.

```text
Model → Supports & Loads → Analysis → Results → Report
```

---

## 🛠️ Technologies Used

- **Python** — Structural analysis
- **Flask** — Backend and web server
- **NumPy** — Numerical and matrix calculations
- **HTML / CSS / JavaScript** — Frontend
- **HTML5 Canvas** — Structural visualization
- **HTML2PDF** — PDF report generation

---

# ✏️ Features

### 🧩 Structural Modeling

- Create, edit, and delete nodes.
- Create and edit frame members with `E`, `A`, and `I` properties.
- Interactive structure visualization with node and member labels.

### 🧱 Supports

- Assign restraints in `Ux`, `Uy`, and `Rz`.
- Supports multiple support configurations.
- Support prescribed displacement/rotation conditions.

### 🏋️ Loads

- Nodal horizontal and vertical forces
- Nodal moments
- Point member loads
- UDL
- Partial UDL
- Trapezoidal loads
- Member moments
- Multiple node/member assignments

### 🔢 Structural Analysis

- 2D frame analysis using the **Direct Stiffness Method**.
- Global stiffness matrix assembly and numerical solution.
- Calculates nodal displacements, support reactions, and member end forces.
- Includes structural stability/error checking.

### 📊 Results

Results are available for:

- Support reactions
- Nodal displacements
- Member forces
- Shear Force Diagram (SFD)
- Bending Moment Diagram (BMD)
- Member deflection

### 📈 Post-Processing

- Maximum and minimum shear values.
- Maximum and minimum bending moments.
- Maximum and minimum deflections.
- Location of critical values along members.

### 🖥️ Visualization

- Interactive structure view using HTML5 Canvas.
- Zoom, pan, and reset controls.
- Show/hide supports, loads, and labels.
- Display SFD, BMD, and deflected shape.
- Independent diagram scaling controls.

### 📑 Report Generation

Two report formats are available:

**Tabular Report**
- Select individual result categories and items.
- Generate a structured analysis report.

**Member-Wise Report**
- Generate a separate report for selected members.
- Include geometry, loads, end forces, maximum values, SFD, BMD, and deflection.

### 📄 PDF Export

- Preview the selected report contents.
- Export the generated structural analysis report as a PDF.

---

# 📂 Project Structure

```text
Frame-Structural-Analyzer/
│
├── app.py
├── stuructural_analysis_solver.py
├── requirements.txt
│
├── templates/
│   └── index.html
│
├── static/
│   ├── style.css
│   ├── css/
│   │   ├── base.css
│   │   ├── diagram.css
│   │   ├── header.css
│   │   ├── layout.css
│   │   ├── page1.css
│   │   ├── page2.css
│   │   ├── report_page.css
│   │   ├── report_preview.css
│   │   └── result_page.css
|   |
│   ├── images/
│   └── js/
│       ├── ui.js
│       ├── data.js
│       ├── drawing.js
│       ├── analysis.js
│       ├── navigation.js
│       ├── report.js
│       └── main.js
│
└── README.md
```

---

# 🎯 Project Objectives

- Develop an interactive web-based structural analysis tool.
- Implement 2D frame analysis using the Direct Stiffness Method.
- Provide graphical structural visualization.
- Automate structural result processing and reporting.
- Create a foundation for further structural engineering software development.

---

# 🔮 Future Scope

- 3D frame analysis
- Additional element types
- Load combinations
- Structural design modules
- Material and section libraries
- Advanced reporting
- Model save/load functionality
- Cloud deployment

---

# 👨‍💻 Developer

**Kuldeep Sahu**  
Civil Engineering Student

📧 **Email:** kuldeepsahu67891234@gmail.com

---

## ⚠️ Disclaimer

This application is intended for **educational, learning, and research purposes**. Results should be independently verified before being used for real-world structural design.

---

⭐ **If you find this project useful, consider giving the repository a star!**