// =============================================
// SHARED MEMBER DIAGRAM RENDERER
// =============================================

function createMemberDiagramImage({
    title,
    x,
    values,
    unit = "",
    color = "#2453b8"
}) {
    if (!Array.isArray(x) || !Array.isArray(values) ||
        x.length < 2 || x.length !== values.length) {
        return "";
    }

    const points = x.map((position, i) => ({
        x: Number(position),
        y: Number(values[i])
    }));

    if (points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) {
        return "";
    }

    const canvas = document.createElement("canvas");
    canvas.width = 700;
    canvas.height = 220;

    const ctx = canvas.getContext("2d");

    const left = 55, right = 670;
    const top = 40, bottom = 175;
    const width = right - left;
    const height = bottom - top;

    const minX = points[0].x;
    const maxX = points[points.length - 1].x;
    const maxValue = Math.max(...points.map(p => Math.abs(p.y)), 1e-9);

    const scale = height * 0.42 / maxValue;
    const zeroY = (top + bottom) / 2;

    const px = value => left + (value - minX) / (maxX - minX) * width;
    const py = value => zeroY - value * scale;

    // Title
    ctx.fillStyle = "#1f3c88";
    ctx.font = "bold 15px Arial";
    ctx.fillText(title, left, 22);

    // Zero axis
    ctx.beginPath();
    ctx.moveTo(left, zeroY);
    ctx.lineTo(right, zeroY);
    ctx.strokeStyle = "#65748b";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Diagram area
    ctx.beginPath();
    ctx.moveTo(px(points[0].x), zeroY);

    points.forEach(p => ctx.lineTo(px(p.x), py(p.y)));

    ctx.lineTo(px(points[points.length - 1].x), zeroY);
    ctx.closePath();

    ctx.fillStyle = color + "30";
    ctx.fill();

    // Diagram curve
    ctx.beginPath();

    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(px(p.x), py(p.y));
        else ctx.lineTo(px(p.x), py(p.y));
    });

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // End values
    ctx.fillStyle = "#334155";
    ctx.font = "11px Arial";
    ctx.fillText(`${minX.toFixed(2)} m`, left, bottom + 18);
    ctx.textAlign = "right";
    ctx.fillText(`${maxX.toFixed(2)} m`, right, bottom + 18);
    ctx.textAlign = "left";
    ctx.fillText(unit, right + 3, zeroY - 5);

    return canvas.toDataURL("image/png");
}


// =============================================
// PM INTERACTION CURVE
// =============================================

function createPMInteractionDiagram({
    Pu,
    Mu,
    requiredPu,
    requiredMu,
    capacityMu,
    title = "P-M Interaction Curve"
}) {
    if (!Array.isArray(Pu) || !Array.isArray(Mu) ||
        Pu.length < 2 || Pu.length !== Mu.length) return "";

    const points = Pu.map((p, i) => ({
        x: Number(Mu[i]),
        y: Number(p)
    }));

    if (points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) {
        return "";
    }

    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 680;

    const ctx = canvas.getContext("2d");

    const left = 65, right = 575;
    const top = 55, bottom = 620;

    const minX = Math.min(0, ...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x)) * 1.05;
    const minY = Math.min(0, ...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y)) * 1.05;

    const px = x => left + (x - minX) / (maxX - minX) * (right - left);
    const py = y => bottom - (y - minY) / (maxY - minY) * (bottom - top);

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = "#1D45AB";
    ctx.font = "bold 19px Arial";
    ctx.textAlign = "center";
    ctx.fillText(title, canvas.width / 2, 25);

    // Grid and axes
    ctx.strokeStyle = "#d5dbe5";
    ctx.lineWidth = 1;
    ctx.font = "12px Arial";
    ctx.fillStyle = "#000000";

    for (let i = 0; i <= 5; i++) {
        const x = left + i * (right - left) / 5;
        const y = top + i * (bottom - top) / 5;

        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillText(
            (minX + i * (maxX - minX) / 5).toFixed(0),
            x, bottom + 17
        );

        ctx.textAlign = "right";
        ctx.fillText(
            (maxY - i * (maxY - minY) / 5).toFixed(0),
            left - 8, y + 4
        );
    }

    // Interaction curve
    ctx.beginPath();
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(px(p.x), py(p.y));
        else ctx.lineTo(px(p.x), py(p.y));
    });

    ctx.strokeStyle = "#287bb8";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Required load guide lines
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "#1685dc";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(px(requiredMu), top);
    ctx.lineTo(px(requiredMu), bottom);
    ctx.moveTo(left, py(requiredPu));
    ctx.lineTo(right, py(requiredPu));
    ctx.stroke();

    ctx.setLineDash([]);

    // Required load point
    ctx.beginPath();
    ctx.arc(px(requiredMu), py(requiredPu), 7, 0, Math.PI * 2);
    ctx.fillStyle = "#287bb8";
    ctx.fill();

    // Capacity at required Pu
    ctx.beginPath();
    ctx.arc(px(capacityMu), py(requiredPu), 7, 0, Math.PI * 2);
    ctx.fillStyle = "#ff8c1a";
    ctx.fill();

    // Axis labels
    ctx.fillStyle = "#000000";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Moment Capacity, Mu (kNm)", (left + right) / 2, 665);

    ctx.save();
    ctx.translate(16, (top + bottom) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Axial Capacity, Pu (kN)", 0, 0);
    ctx.restore();

    return canvas.toDataURL("image/png");
}


function createBiaxialInteractionDiagram({
    MuxCapacity,
    MuyCapacity,
    MuxRequired,
    MuyRequired,
    alphaN,
    Pu
}) {
    const values = [
        MuxCapacity, MuyCapacity, MuxRequired,
        MuyRequired, alphaN, Pu
    ].map(Number);

    if (values.some(v => !Number.isFinite(v)) ||
        MuxCapacity <= 0 || MuyCapacity <= 0 || alphaN <= 0) {
        return "";
    }

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 680;

    const ctx = canvas.getContext("2d");

    const [left, right, top, bottom] = [65, 775, 45, 615];

    const maxX = MuxCapacity * 1.12;
    const maxY = MuyCapacity * 1.12;

    const px = x => left + x / maxX * (right - left);
    const py = y => bottom - y / maxY * (bottom - top);

    // Background and title
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#183FA3";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`2D Mx - My Contour at Pu = ${Pu.toFixed(0)} kN`,
        canvas.width / 2, 25);

    // Grid
    ctx.strokeStyle = "#d5dbe5";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#000000";
    ctx.font = "18px Arial";

    for (let i = 0; i <= 5; i++) {
        const x = left + i * (right - left) / 5;
        const y = top + i * (bottom - top) / 5;

        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillText((maxX * i / 5).toFixed(0), x, bottom + 18);

        ctx.textAlign = "right";
        ctx.fillText((maxY * (5 - i) / 5).toFixed(0), left - 8, y + 4);
    }

    // Interaction boundary
    ctx.beginPath();

    for (let i = 0; i <= 100; i++) {
        const theta = (Math.PI / 2) * i / 100;

        const mx = MuxCapacity * Math.pow(Math.cos(theta), 2 / alphaN);
        const my = MuyCapacity * Math.pow(Math.sin(theta), 2 / alphaN);

        if (i === 0) ctx.moveTo(px(mx), py(my));
        else ctx.lineTo(px(mx), py(my));
    }

    ctx.strokeStyle = "#172cff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Required point guide lines
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(px(MuxRequired), top);
    ctx.lineTo(px(MuxRequired), bottom);
    ctx.moveTo(left, py(MuyRequired));
    ctx.lineTo(right, py(MuyRequired));
    ctx.stroke();

    ctx.setLineDash([]);

    // Required point
    ctx.beginPath();
    ctx.arc(px(MuxRequired), py(MuyRequired), 7, 0, Math.PI * 2);
    ctx.fillStyle = "#ff1717";
    ctx.fill();

    // Axis labels
    ctx.fillStyle = "#000000";
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Bending Moment Mux (kNm)", (left + right) / 2, 665);

    ctx.save();
    ctx.translate(17, (top + bottom) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Bending Moment Muy (kNm)", 0, 0);
    ctx.restore();

    return canvas.toDataURL("image/png");
}


// =============================================
// BIAXIAL 3D INTERACTION SURFACE
// =============================================

function drawBiaxial3DInteraction(canvasId, surface, required) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !surface?.Pu?.length) return;

    const ctx = canvas.getContext("2d");
    const Pu = surface.Pu, Mx = surface.Mux, My = surface.Muy;

    const rows = Pu.length, cols = Pu[0]?.length || 0;

    if (rows < 2 || cols < 2 ||
        Mx.length !== rows || My.length !== rows ||
        Mx.some(r => r.length !== cols) ||
        My.some(r => r.length !== cols)) return;

    const numbers = [...Pu.flat(), ...Mx.flat(), ...My.flat()].map(Number);
    if (numbers.some(v => !Number.isFinite(v))) return;

    const maxX = Math.max(...Mx.flat(), 1);
    const maxY = Math.max(...My.flat(), 1);
    const minP = Math.min(...Pu.flat());
    const maxP = Math.max(...Pu.flat());

    const req = {
        x: Number(required?.Mux),
        y: Number(required?.Muy),
        z: Number(required?.Pu)
    };
    if (Object.values(req).some(v => !Number.isFinite(v))) return;

    let azimuth = -1.014;
    let elevation = -1.422;

    let dragging = false, lastX = 0, lastY = 0;

    const w = canvas.width, h = canvas.height;
    const cx = w * 0.48, cy = h * 0.68;

    const point = (x, y, z) => {
        x /= maxX;
        y /= maxY;
        z = (z - minP) / Math.max(maxP - minP, 1);

        const scale = Math.min(w * 0.34, h * 0.48) * zoom;
        let heightScale = 1.45;

        const u = x * Math.cos(azimuth) - y * Math.sin(azimuth);
        const v = x * Math.sin(azimuth) + y * Math.cos(azimuth);

        return {
            x: cx + u * scale + panX,
            y: cy - (v * Math.cos(elevation) - z * Math.sin(elevation)*heightScale) * scale + panY
        };
    };

    const colorAt = value => {
        const t = Math.max(0, Math.min(1,
            (value - minP) / Math.max(maxP - minP, 1)));

        const stops = [
            [115, 105, 150],
            [100, 175, 180],
            [115, 210, 145],
            [245, 235, 100]
        ];
        const k = t * (stops.length - 1);
        const i = Math.min(Math.floor(k), stops.length - 2);
        const f = k - i;
        const c = stops[i].map((v, j) =>
            Math.round(v + (stops[i + 1][j] - v) * f));

        return `rgb(${c.join(",")})`;
    };

    function draw() {

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);

        const p = (x, y, z) => point(x, y, z);
        const z0 = minP, z1 = maxP;

        // Three coordinate planes
        const planes = [
            [[0, 0, z0], [1, 0, z0], [1, 1, z0], [0, 1, z0]],
            [[0, 0, z0], [1, 0, z0], [1, 0, z1], [0, 0, z1]],
            [[0, 0, z0], [0, 1, z0], [0, 1, z1], [0, 0, z1]]
        ];

        planes.forEach((plane, i) => {
            ctx.beginPath();
            plane.forEach((v, j) => {
                const q = p(v[0] * maxX, v[1] * maxY, v[2]);
                j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
            });
            ctx.closePath();
            ctx.fillStyle = i === 0 ? "#f1f3f5" : "#f7f8fa";
            ctx.fill();
            ctx.strokeStyle = "#aeb6c2";
            ctx.stroke();
        });

        // Grid lines and axis tick values
        ctx.strokeStyle = "#b8bec8";
        ctx.lineWidth = 0.8;
        ctx.fillStyle = "#374151";
        ctx.font = "11px Arial";

        for (let i = 0; i <= 5; i++) {
            const t = i / 5;

            // XY plane
            let a = p(t * maxX, 0, z0), b = p(t * maxX, maxY, z0);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

            a = p(0, t * maxY, z0); b = p(maxX, t * maxY, z0);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

            // Vertical plane grids
            a = p(t * maxX, 0, z0); b = p(t * maxX, 0, z1);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

            a = p(0, t * maxY, z0); b = p(0, t * maxY, z1);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

            // Tick labels
            const xTick = p(t * maxX, 0, z0);
            ctx.textAlign = "center";
            ctx.fillText((t * maxX).toFixed(0), xTick.x, xTick.y + 17);

            const yTick = p(0, t * maxY, z0);
            ctx.textAlign = "right";
            ctx.fillText((t * maxY).toFixed(0), yTick.x - 8, yTick.y + 4);

            const zTick = p(0, 0, minP + t * (maxP - minP));
            ctx.textAlign = "right";
            ctx.fillText((minP + t * (maxP - minP)).toFixed(0),
                zTick.x - 9, zTick.y + 4);
        }

        // Surface faces
        for (let i = 0; i < rows - 1; i++) {
            for (let j = 0; j < cols - 1; j++) {
                const vertices = [
                    [Mx[i][j], My[i][j], Pu[i][j]],
                    [Mx[i][j + 1], My[i][j + 1], Pu[i][j + 1]],
                    [Mx[i + 1][j + 1], My[i + 1][j + 1], Pu[i + 1][j + 1]],
                    [Mx[i + 1][j], My[i + 1][j], Pu[i + 1][j]]
                ];

                ctx.beginPath();
                vertices.forEach((v, k) => {
                    const q = p(v[0], v[1], v[2]);
                    k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
                });
                ctx.closePath();
                ctx.fillStyle = colorAt(vertices.reduce((s, v) => s + v[2], 0) / 4);
                ctx.globalAlpha = 0.72;
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.strokeStyle = "rgba(30,50,65,0.55)";
                ctx.lineWidth = 0.55;
                ctx.stroke();
            }
        }

        // Required load point and projection lines onto axis planes
        const loadPoint = p(req.x, req.y, req.z);
        const projections = [
            p(req.x, req.y, minP),
            p(req.x, 0, minP),
            p(0, req.y, minP)
        ];

        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = "#e05235";
        ctx.lineWidth = 1.5;

        projections.forEach(q => {
            ctx.beginPath();
            ctx.moveTo(loadPoint.x, loadPoint.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
        });

        ctx.restore();

        ctx.beginPath();
        ctx.arc(loadPoint.x, loadPoint.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ff1717";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Axis labels
        ctx.fillStyle = "#111827";
        ctx.font = "italic 13px Arial";
        ctx.textAlign = "center";

        let q = p(maxX, 0, z0);
        ctx.fillText("Mux (kNm)", q.x + 20, q.y + 38);

        q = p(0, maxY, z0);
        ctx.fillText("Muy (kNm)", q.x - 25, q.y + 25);

        q = p(0, 0, z1);
        ctx.textAlign = "left";
        ctx.fillText("Pu (kN)", q.x - 35, q.y - 15);

        // Legend
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#ccc";
        ctx.fillRect(w - 185, 12, 170, 28);
        ctx.strokeRect(w - 185, 12, 170, 28);
        ctx.beginPath();
        ctx.arc(w - 165, 26, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#ff1717";
        ctx.fill();
        ctx.fillStyle = "#222";
        ctx.font = "12px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Required Load Point", w - 148, 30);
    }

    // Mouse controls: left = rotate, right = translate, scroll = zoom
    let panX = -240, panY = 176.8, zoom = 2.242;

    window.getBiaxialCamera = () => ({
        panX: panX,
        panY: panY,
        zoom: zoom
    });

    let dragMode = null;

    canvas.oncontextmenu = e => e.preventDefault();

    canvas.onpointerdown = e => {
        if (e.button === 0) dragMode = "rotate";
        else if (e.button === 2) dragMode = "pan";
        else return;

        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
    };

    canvas.onpointermove = e => {
        if (!dragging) return;

        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;

        if (dragMode === "rotate") {
            azimuth += dx * 0.008;
            elevation = Math.max(-Math.PI / 2, Math.min(
                Math.PI / 2,
                elevation + dy * 0.005
            ));
        } else if (dragMode === "pan") {
            panX += dx;
            panY += dy;
        }

        lastX = e.clientX;
        lastY = e.clientY;
        draw();
    };

    canvas.onpointerup = canvas.onpointercancel = () => {
        dragging = false;
        dragMode = null;
    };

    canvas.onwheel = e => {
        e.preventDefault();
        zoom = Math.max(0.5, Math.min(3, zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
        draw();
    };

    draw();
}