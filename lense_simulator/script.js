class LensSimulator {
    constructor() {
        this.canvas = document.getElementById('simulatorCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ruler = document.getElementById('ruler');
        
        this.lightSource = {
            x: 100,
            y: this.canvas.height / 2,
            intensity: 80,
            isDragging: false
        };
        
        this.lenses = [];
        this.screen = {
            x: 900,
            isDragging: false
        };
        
        this.selectedElement = null;
        this.init();
    }
    
    init() {
        this.drawRuler();
        this.setupEventListeners();
        this.addLens();
        this.animate();
    }
    
    drawRuler() {
        const rulerCanvas = document.createElement('canvas');
        rulerCanvas.width = this.canvas.width;
        rulerCanvas.height = 40;
        const rulerCtx = rulerCanvas.getContext('2d');
        
        rulerCtx.fillStyle = '#f8f8f8';
        rulerCtx.fillRect(0, 0, rulerCanvas.width, rulerCanvas.height);
        
        rulerCtx.strokeStyle = '#666';
        rulerCtx.fillStyle = '#666';
        rulerCtx.font = '10px Arial';
        rulerCtx.textAlign = 'center';
        
        for (let i = 0; i <= this.canvas.width; i += 50) {
            const height = i % 100 === 0 ? 20 : 10;
            rulerCtx.beginPath();
            rulerCtx.moveTo(i, 40);
            rulerCtx.lineTo(i, 40 - height);
            rulerCtx.stroke();
            
            if (i % 100 === 0) {
                rulerCtx.fillText(i + 'mm', i, 10);
            }
        }
        
        this.ruler.appendChild(rulerCanvas);
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        document.getElementById('lightPosition').addEventListener('input', (e) => {
            this.lightSource.x = parseInt(e.target.value);
        });
        
        document.getElementById('lightIntensity').addEventListener('input', (e) => {
            this.lightSource.intensity = parseInt(e.target.value);
        });
        
        document.getElementById('screenPosition').addEventListener('input', (e) => {
            this.screen.x = parseInt(e.target.value);
        });
        
        document.getElementById('addLens').addEventListener('click', () => {
            this.addLens();
        });
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isPointInLightSource(x, y)) {
            this.lightSource.isDragging = true;
            this.selectedElement = 'light';
        } else if (Math.abs(x - this.screen.x) < 10) {
            this.screen.isDragging = true;
            this.selectedElement = 'screen';
        } else {
            for (let i = 0; i < this.lenses.length; i++) {
                if (Math.abs(x - this.lenses[i].x) < 20) {
                    this.lenses[i].isDragging = true;
                    this.selectedElement = 'lens' + i;
                    break;
                }
            }
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.lightSource.isDragging) {
            this.lightSource.x = Math.max(50, Math.min(x, this.canvas.width - 50));
            this.lightSource.y = Math.max(50, Math.min(y, this.canvas.height - 50));
            document.getElementById('lightPosition').value = this.lightSource.x;
        } else if (this.screen.isDragging) {
            this.screen.x = Math.max(600, Math.min(x, this.canvas.width - 50));
            document.getElementById('screenPosition').value = this.screen.x;
        } else {
            for (let lens of this.lenses) {
                if (lens.isDragging) {
                    lens.x = Math.max(200, Math.min(x, this.screen.x - 50));
                    this.updateLensControl(lens);
                }
            }
        }
    }
    
    handleMouseUp() {
        this.lightSource.isDragging = false;
        this.screen.isDragging = false;
        this.lenses.forEach(lens => lens.isDragging = false);
        this.selectedElement = null;
    }
    
    isPointInLightSource(x, y) {
        const dx = x - this.lightSource.x;
        const dy = y - this.lightSource.y;
        return Math.sqrt(dx * dx + dy * dy) < 30;
    }
    
    addLens() {
        const lens = {
            id: Date.now(),
            x: 300 + this.lenses.length * 150,
            focalLength: 100,
            diameter: 100,
            thickness: 30,
            type: 'convex',
            isDragging: false
        };
        
        this.lenses.push(lens);
        this.createLensControl(lens);
    }
    
    createLensControl(lens) {
        const controlsDiv = document.getElementById('lensControls');
        const lensDiv = document.createElement('div');
        lensDiv.className = 'lens-control';
        lensDiv.id = `lens-${lens.id}`;
        
        lensDiv.innerHTML = `
            <label>Position: <input type="range" min="200" max="${this.screen.x - 50}" value="${lens.x}" 
                onchange="simulator.updateLens(${lens.id}, 'x', this.value)"></label>
            <label>Focal: <input type="range" min="50" max="200" value="${lens.focalLength}" 
                onchange="simulator.updateLens(${lens.id}, 'focalLength', this.value)"></label>
            <label>Diameter: <input type="range" min="60" max="200" value="${lens.diameter}" 
                onchange="simulator.updateLens(${lens.id}, 'diameter', this.value)"></label>
            <label>Thickness: <input type="range" min="10" max="60" value="${lens.thickness}" 
                onchange="simulator.updateLens(${lens.id}, 'thickness', this.value)"></label>
            <label>Type: 
                <select onchange="simulator.updateLens(${lens.id}, 'type', this.value)">
                    <option value="convex">Convex</option>
                    <option value="concave">Concave</option>
                </select>
            </label>
            <button class="remove-lens" onclick="simulator.removeLens(${lens.id})">Remove</button>
        `;
        
        controlsDiv.appendChild(lensDiv);
    }
    
    updateLens(id, property, value) {
        const lens = this.lenses.find(l => l.id === id);
        if (lens) {
            lens[property] = property === 'type' ? value : parseFloat(value);
        }
    }
    
    updateLensControl(lens) {
        const input = document.querySelector(`#lens-${lens.id} input[type="range"]`);
        if (input) input.value = lens.x;
    }
    
    removeLens(id) {
        this.lenses = this.lenses.filter(l => l.id !== id);
        document.getElementById(`lens-${id}`).remove();
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid();
        this.drawOpticalAxis();
        this.drawLightSource();
        this.drawLenses();
        this.drawScreen();
        this.drawLightRays();
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 0.5;
        
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawOpticalAxis() {
        this.ctx.strokeStyle = '#999';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height / 2);
        this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    drawLightSource() {
        const { x, y } = this.lightSource;
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 30, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFA500';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FF6347';
        const emissionPoints = [
            { x: x, y: y - 20 },
            { x: x, y: y },
            { x: x, y: y + 20 }
        ];
        
        emissionPoints.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawLenses() {
        this.lenses.forEach(lens => {
            const { x, focalLength, diameter, thickness, type } = lens;
            const centerY = this.canvas.height / 2;
            const centerThickness = type === 'convex' ? thickness : thickness * 0.3;
            const edgeThickness = type === 'convex' ? thickness * 0.2 : thickness;
            
            this.ctx.strokeStyle = '#4169E1';
            this.ctx.lineWidth = 2;
            this.ctx.fillStyle = 'rgba(135, 206, 250, 0.3)';
            
            if (type === 'convex') {
                // Convex lens - thick in middle, thin at edges
                const radius = diameter * 1.5;
                this.ctx.beginPath();
                // Left curve
                this.ctx.arc(x - radius + centerThickness/2, centerY, radius, -Math.asin(diameter/2/radius), Math.asin(diameter/2/radius));
                // Right curve
                this.ctx.arc(x + radius - centerThickness/2, centerY, radius, Math.PI - Math.asin(diameter/2/radius), Math.PI + Math.asin(diameter/2/radius));
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            } else {
                // Concave lens - thin in middle, thick at edges
                this.ctx.beginPath();
                // Top edge
                this.ctx.moveTo(x - edgeThickness/2, centerY - diameter/2);
                // Left curve inward
                this.ctx.quadraticCurveTo(x - centerThickness/2, centerY, x - edgeThickness/2, centerY + diameter/2);
                // Bottom edge
                this.ctx.lineTo(x + edgeThickness/2, centerY + diameter/2);
                // Right curve inward
                this.ctx.quadraticCurveTo(x + centerThickness/2, centerY, x + edgeThickness/2, centerY - diameter/2);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            }
            
            this.ctx.fillStyle = '#333';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`f=${focalLength}mm`, x, centerY + diameter/2 + 20);
        });
    }
    
    drawScreen() {
        const centerY = this.canvas.height / 2;
        const height = 400;
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(this.screen.x, centerY - height/2);
        this.ctx.lineTo(this.screen.x, centerY + height/2);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(this.screen.x - 2, centerY - height/2 - 10, 4, height + 20);
    }
    
    drawLightRays() {
        const emissionPoints = [
            { x: this.lightSource.x, y: this.lightSource.y - 20 },
            { x: this.lightSource.x, y: this.lightSource.y },
            { x: this.lightSource.x, y: this.lightSource.y + 20 }
        ];
        
        const colors = ['#FF0000', '#00FF00', '#0000FF'];
        const opticalAxis = this.canvas.height / 2;
        
        emissionPoints.forEach((point, index) => {
            this.ctx.strokeStyle = colors[index];
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = this.lightSource.intensity / 100;
            
            let currentX = point.x;
            let currentY = point.y;
            let angle = Math.atan2(opticalAxis - point.y, 100);
            
            this.ctx.beginPath();
            this.ctx.moveTo(currentX, currentY);
            
            const sortedLenses = [...this.lenses].sort((a, b) => a.x - b.x);
            
            for (let lens of sortedLenses) {
                if (lens.x > currentX) {
                    this.ctx.lineTo(lens.x, currentY + (lens.x - currentX) * Math.tan(angle));
                    
                    const heightAtLens = currentY + (lens.x - currentX) * Math.tan(angle);
                    const distanceFromAxis = Math.abs(heightAtLens - opticalAxis);
                    
                    if (distanceFromAxis < lens.diameter / 2) {
                        const refractedAngle = this.calculateRefraction(
                            angle, 
                            heightAtLens - opticalAxis, 
                            lens.focalLength, 
                            lens.type
                        );
                        
                        currentX = lens.x;
                        currentY = heightAtLens;
                        angle = refractedAngle;
                    }
                }
            }
            
            const finalY = currentY + (this.screen.x - currentX) * Math.tan(angle);
            this.ctx.lineTo(this.screen.x, finalY);
            this.ctx.stroke();
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    calculateRefraction(incomingAngle, heightFromAxis, focalLength, lensType) {
        if (lensType === 'convex') {
            return -heightFromAxis / focalLength;
        } else {
            return heightFromAxis / focalLength;
        }
    }
}

const simulator = new LensSimulator();