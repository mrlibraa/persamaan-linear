document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi aplikasi
    const sizeSelect = document.getElementById('size');
    const generateMatrixBtn = document.getElementById('generate-matrix');
    const calculateGaussBtn = document.getElementById('calculate-gauss');
    const calculateGaussJordanBtn = document.getElementById('calculate-gauss-jordan');
    const resetBtn = document.getElementById('reset');
    const matrixContainer = document.getElementById('matrix-container');
    const solutionResult = document.getElementById('solution-result');
    const stepsResult = document.getElementById('steps-result');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    // Buat matriks input saat halaman dimuat
    generateMatrix();

    // Event listeners
    generateMatrixBtn.addEventListener('click', generateMatrix);
    calculateGaussBtn.addEventListener('click', () => calculate('gauss'));
    calculateGaussJordanBtn.addEventListener('click', () => calculate('gauss-jordan'));
    resetBtn.addEventListener('click', resetCalculator);

    // Tab navigation
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Fungsi untuk membuat matriks input
    function generateMatrix() {
        const size = parseInt(sizeSelect.value);
        matrixContainer.innerHTML = '';

        for (let i = 0; i < size; i++) {
            const row = document.createElement('div');
            row.className = 'matrix-row';

            for (let j = 0; j < size; j++) {
                const cell = document.createElement('input');
                cell.type = 'number';
                cell.className = 'matrix-cell';
                cell.placeholder = `a${i+1}${j+1}`;
                cell.value = (i === j) ? '1' : '0'; // Default to identity matrix
                row.appendChild(cell);
            }

            // Tambahkan kolom hasil
            const resultCell = document.createElement('input');
            resultCell.type = 'number';
            resultCell.className = 'matrix-cell';
            resultCell.placeholder = `b${i+1}`;
            resultCell.value = '0';
            row.appendChild(resultCell);

            matrixContainer.appendChild(row);
        }
    }

    // Fungsi untuk mendapatkan matriks dari input
    function getMatrixFromInput() {
        const size = parseInt(sizeSelect.value);
        const matrix = [];
        const rows = matrixContainer.querySelectorAll('.matrix-row');

        for (let i = 0; i < size; i++) {
            const row = [];
            const cells = rows[i].querySelectorAll('.matrix-cell');

            for (let j = 0; j < size; j++) {
                row.push(parseFloat(cells[j].value) || 0);
            }

            // Tambahkan nilai b (hasil)
            const bValue = parseFloat(cells[size].value) || 0;
            matrix.push([...row, bValue]);
        }

        return matrix;
    }

    // Fungsi untuk menghitung dengan metode Gauss atau Gauss-Jordan
    function calculate(method) {
        const matrix = getMatrixFromInput();
        const size = matrix.length;
        const steps = [];
        let solution = '';

        // Salin matriks untuk perhitungan
        let calcMatrix = JSON.parse(JSON.stringify(matrix));

        // Langkah 1: Eliminasi maju (Forward Elimination)
        steps.push({
            title: 'Matriks Awal',
            matrix: JSON.parse(JSON.stringify(calcMatrix))
        });

        for (let i = 0; i < size; i++) {
            // Cari pivot maksimum untuk stabilitas numerik
            let maxRow = i;
            for (let j = i + 1; j < size; j++) {
                if (Math.abs(calcMatrix[j][i]) > Math.abs(calcMatrix[maxRow][i])) {
                    maxRow = j;
                }
            }

            // Tukar baris jika diperlukan
            if (maxRow !== i) {
                [calcMatrix[i], calcMatrix[maxRow]] = [calcMatrix[maxRow], calcMatrix[i]];
                steps.push({
                    title: `Pertukaran Baris R${i+1} ↔ R${maxRow+1}`,
                    matrix: JSON.parse(JSON.stringify(calcMatrix))
                });
            }

            // Jika pivot adalah 0, matriks singular
            if (Math.abs(calcMatrix[i][i]) < 1e-10) {
                solution = 'Sistem persamaan tidak memiliki solusi unik (matriks singular).';
                displayResults(solution, steps);
                return;
            }

            // Eliminasi untuk membuat segitiga atas
            for (let j = i + 1; j < size; j++) {
                const factor = calcMatrix[j][i] / calcMatrix[i][i];
                
                for (let k = i; k < size + 1; k++) {
                    calcMatrix[j][k] -= factor * calcMatrix[i][k];
                }

                steps.push({
                    title: `Eliminasi: R${j+1} → R${j+1} - (${factor.toFixed(2)}) × R${i+1}`,
                    matrix: JSON.parse(JSON.stringify(calcMatrix))
                });
            }
        }

        // Untuk Gauss-Jordan, lanjutkan eliminasi mundur
        if (method === 'gauss-jordan') {
            for (let i = size - 1; i >= 0; i--) {
                // Normalisasi baris pivot
                const pivot = calcMatrix[i][i];
                for (let j = i; j < size + 1; j++) {
                    calcMatrix[i][j] /= pivot;
                }

                steps.push({
                    title: `Normalisasi: R${i+1} → R${i+1} / ${pivot.toFixed(2)}`,
                    matrix: JSON.parse(JSON.stringify(calcMatrix))
                });

                // Eliminasi mundur
                for (let j = i - 1; j >= 0; j--) {
                    const factor = calcMatrix[j][i];
                    for (let k = i; k < size + 1; k++) {
                        calcMatrix[j][k] -= factor * calcMatrix[i][k];
                    }

                    steps.push({
                        title: `Eliminasi Mundur: R${j+1} → R${j+1} - (${factor.toFixed(2)}) × R${i+1}`,
                        matrix: JSON.parse(JSON.stringify(calcMatrix))
                    });
                }
            }

            // Solusi langsung dari diagonal
            solution = 'Solusi sistem persamaan:\n';
            for (let i = 0; i < size; i++) {
                solution += `x${i+1} = ${calcMatrix[i][size].toFixed(4)}\n`;
            }
        } else {
            // Untuk Gauss biasa, lakukan substitusi mundur
            const x = new Array(size).fill(0);
            for (let i = size - 1; i >= 0; i--) {
                x[i] = calcMatrix[i][size];
                for (let j = i + 1; j < size; j++) {
                    x[i] -= calcMatrix[i][j] * x[j];
                }
                x[i] /= calcMatrix[i][i];
            }

            solution = 'Solusi sistem persamaan:\n';
            for (let i = 0; i < size; i++) {
                solution += `x${i+1} = ${x[i].toFixed(4)}\n`;
            }
        }

        displayResults(solution, steps);
        switchTab('solution');
    }

    // Fungsi untuk menampilkan hasil
    function displayResults(solution, steps) {
        solutionResult.textContent = solution;

        // Format langkah-langkah
        let stepsHTML = '';
        steps.forEach((step, index) => {
            stepsHTML += `
                <div class="step">
                    <div class="step-title">Langkah ${index + 1}: ${step.title}</div>
                    <div class="matrix-display">${formatMatrix(step.matrix)}</div>
                </div>
            `;
        });

        stepsResult.innerHTML = stepsHTML;
    }

    // Fungsi untuk memformat matriks untuk ditampilkan
    function formatMatrix(matrix) {
        let formatted = '';
        const size = matrix.length;

        for (let i = 0; i < size; i++) {
            formatted += '| ';
            for (let j = 0; j < size; j++) {
                formatted += matrix[i][j].toFixed(2).padStart(7);
            }
            formatted += ' | ' + matrix[i][size].toFixed(2).padStart(7) + ' |\n';
        }

        return formatted;
    }

    // Fungsi untuk reset kalkulator
    function resetCalculator() {
        generateMatrix();
        solutionResult.textContent = '';
        stepsResult.textContent = '';
        switchTab('solution');
    }

    // Fungsi untuk berpindah tab
    function switchTab(tabId) {
        tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        tabContents.forEach(content => {
            if (content.id === `${tabId}-content`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }
});