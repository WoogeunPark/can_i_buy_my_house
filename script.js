document.addEventListener('DOMContentLoaded', () => {
    // --- Input Elements ---
    const elements = {
        housePrice: document.getElementById('house-price'),
        housePriceDisplay: document.getElementById('house-price-display'),
        ltvRange: document.getElementById('ltv-range'),
        ltvInput: document.getElementById('ltv'),
        interestRate: document.getElementById('interest-rate'),
        loanTermRange: document.getElementById('loan-term-range'),
        loanTermInput: document.getElementById('loan-term'),

        annualIncome: document.getElementById('annual-income'),
        annualIncomeDisplay: document.getElementById('annual-income-display'),

        mainLoanMethod: document.getElementById('main-loan-method'),
        policyLoanCheck: document.getElementById('policy-loan-check'),

        debtListContainer: document.getElementById('debt-list-container'),
        addDebtBtn: document.getElementById('add-debt-btn'),

        assetCash: document.getElementById('asset-cash'),
        assetSavings: document.getElementById('asset-savings'),
        assetStock: document.getElementById('asset-stock'),
        assetOther: document.getElementById('asset-other'),
        totalAssetsDisplay: document.getElementById('total-assets-display'),

        maxLoanAmount: document.getElementById('max-loan-amount'),
        requiredCash: document.getElementById('total-required-display'),
        additionalCash: document.getElementById('additional-value'),
        monthlyPayment: document.getElementById('monthly-payment'),
        yearlyInterest: document.getElementById('yearly-interest'),

        taxAmount: document.getElementById('tax-value'),
        feeAmount: document.getElementById('fee-value'),
        commonMethodDisplay: document.getElementById('common-method-display'),

        dsrValue: document.getElementById('dsr-value'),
        dsrStatus: document.getElementById('dsr-status'),
        dsrCard: document.getElementById('dsr-card'),
        dsrText: document.getElementById('dsr-text')
    };

    // --- Helper Functions ---
    function formatKoreanNumber(number) {
        if (number === 0) return '0원';
        const units = ['', '만', '억', '조', '경'];
        const splitUnit = 10000;
        let result = [];
        let curr = Number(number);
        for (let i = 0; i < units.length; i++) {
            let remain = curr % splitUnit;
            if (remain > 0) result.unshift(`${remain.toLocaleString()}${units[i]}`);
            curr = Math.floor(curr / splitUnit);
            if (curr === 0) break;
        }
        return result.join(' ') + '원';
    }

    function parseCurrency(str) {
        if (!str) return 0;
        return Number(str.replace(/[^0-9]/g, ''));
    }

    function formatNumber(num) {
        return num.toLocaleString('ko-KR');
    }

    function handleCurrencyInput(e, displayElement) {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (!value) {
            e.target.value = '';
            if (displayElement) displayElement.textContent = '0원';
            calculate();
            return;
        }
        let numValue = parseInt(value, 10);
        e.target.value = formatNumber(numValue);
        if (displayElement) displayElement.textContent = formatKoreanNumber(numValue);
        calculate();
    }

    function syncInputs(source, target) {
        target.value = source.value;
        calculate();
    }

    // --- Date Select Generators ---
    function getYearOptions() {
        const currentYear = new Date().getFullYear();
        let options = `<option value="">연도 선택</option>`;
        for (let i = 0; i < 40; i++) {
            options += `<option value="${currentYear + i}">${currentYear + i}년</option>`;
        }
        return options;
    }

    function getMonthOptions() {
        let options = `<option value="">월 선택</option>`;
        for (let i = 1; i <= 12; i++) {
            options += `<option value="${i}">${i}월</option>`;
        }
        return options;
    }

    // --- Dynamic Debt List ---
    function addDebtItem() {
        const id = Date.now();
        const debtItem = document.createElement('div');
        debtItem.className = 'debt-item';
        debtItem.dataset.id = id;

        const yearOptions = getYearOptions();
        const monthOptions = getMonthOptions();

        debtItem.innerHTML = `
            <div class="debt-header">
                <span class="debt-title">대출 #${document.querySelectorAll('.debt-item').length + 1}</span>
                <button type="button" class="btn-remove" onclick="removeDebtItem(${id})">×</button>
            </div>
            <div class="debt-grid">
                <div class="debt-input-group full-width">
                    <label>대출 종류</label>
                    <select class="debt-type">
                        <optgroup label="주택담보대출">
                            <option value="mortgage_amortized">주택담보대출 (분할상환)</option>
                            <option value="mortgage_bullet">주택담보대출 (일시상환 - DSR산정:10년)</option>
                            <option value="intermediate">중도금/이주비 (DSR산정:25년)</option>
                        </optgroup>
                        <optgroup label="기타대출 (DSR 산정 만기 적용)">
                            <option value="credit">신용대출 (DSR산정:5년)</option>
                            <option value="non_housing">비주택담보 (DSR산정:8년)</option>
                            <option value="other_collateral">기타담보 (DSR산정:10년)</option>
                            <option value="jeonse_guarantee">전세보증금담보 (DSR산정:4년)</option>
                            <option value="jeonse_etc">전세/예적금 (이자만 납부)</option>
                            <option value="long_card">장기카드 (DSR산정:3년)</option>
                            <option value="other">기타</option>
                        </optgroup>
                    </select>
                </div>
                
                <div class="debt-input-group">
                    <label>대출 잔액 (원)</label>
                    <input type="text" class="debt-amount" placeholder="예: 50,000,000" inputmode="numeric">
                </div>
                <div class="debt-input-group">
                    <label>연 이자율 (%)</label>
                    <input type="number" class="debt-rate" placeholder="예: 4.5" step="0.01">
                </div>

                <div class="debt-input-group date-group">
                    <label>실제 만기 년/월 (선택)</label>
                    <div class="date-select-row">
                        <select class="debt-maturity-year">${yearOptions}</select>
                        <select class="debt-maturity-month">${monthOptions}</select>
                    </div>
                </div>
                <div class="debt-input-group grace-group">
                    <label>남은 거치 기간 (개월)</label>
                    <input type="number" class="debt-grace" placeholder="0" min="0">
                </div>
                
                <div class="debt-input-group full-width" style="margin-top: 0.5rem;">
                     <div class="checkbox-group">
                        <input type="checkbox" class="debt-bullet-check" id="bullet-${id}">
                        <label for="bullet-${id}">만기 일시 상환 (이자만 납부)</label>
                     </div>
                </div>
                
                <div class="debt-notice full-width" style="display:none; color: var(--text-muted); font-size: 0.8rem; margin-top: -0.5rem;">
                    * 이자 상환액만 DSR에 반영됩니다.
                </div>
            </div>
        `;

        elements.debtListContainer.appendChild(debtItem);

        const amountInput = debtItem.querySelector('.debt-amount');
        amountInput.addEventListener('input', (e) => handleCurrencyInput(e, null));

        const typeSelect = debtItem.querySelector('.debt-type');
        const dateGroup = debtItem.querySelector('.date-group');
        const graceGroup = debtItem.querySelector('.grace-group');
        const notice = debtItem.querySelector('.debt-notice');

        // Dynamic Visibility Logic
        function updateVisibility() {
            const type = typeSelect.value;
            if (type === 'jeonse_etc') {
                dateGroup.style.display = 'none';
                graceGroup.style.display = 'none';
                notice.style.display = 'block';
                debtItem.querySelector('.debt-maturity-year').value = '';
                debtItem.querySelector('.debt-maturity-month').value = '';
                debtItem.querySelector('.debt-grace').value = '';
            } else {
                dateGroup.style.display = 'block';
                graceGroup.style.display = 'block';
                notice.style.display = 'none';
            }
            calculate();
        }

        typeSelect.addEventListener('change', () => {
            updateVisibility();
            updateDebtTitle(debtItem);
        });

        const inputs = debtItem.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input !== amountInput && input !== typeSelect) {
                input.addEventListener('input', () => {
                    validateGracePeriod(debtItem);
                    calculate();
                });
            }
        });

        updateVisibility();
        updateDebtTitle(debtItem);
        validateGracePeriod(debtItem);
        calculate();
    }

    function validateGracePeriod(debtItem) {
        const graceInput = debtItem.querySelector('.debt-grace');
        const maturityYear = debtItem.querySelector('.debt-maturity-year').value;
        const graceMonths = Number(graceInput.value) || 0;

        // Find or create warning element
        let warning = debtItem.querySelector('.grace-warning');
        if (!warning) {
            warning = document.createElement('div');
            warning.className = 'grace-warning';
            warning.style.cssText = 'color: #ef4444; font-size: 0.8rem; margin-top: 0.25rem; display: none;';
            graceInput.parentElement.appendChild(warning);
        }

        if (maturityYear && graceMonths > 0) {
            const currentYear = new Date().getFullYear();
            const termYears = Number(maturityYear) - currentYear;
            const termMonths = termYears * 12;

            if (graceMonths >= termMonths) {
                warning.textContent = `⚠️ 거치기간(${graceMonths}개월)이 만기(${termMonths}개월)와 같거나 깁니다. 만기시 일시상환으로 처리됩니다.`;
                warning.style.display = 'block';
                graceInput.style.borderColor = '#ef4444';
            } else {
                warning.style.display = 'none';
                graceInput.style.borderColor = '';
            }
        } else {
            warning.style.display = 'none';
            graceInput.style.borderColor = '';
        }
    }

    function updateDebtTitle(item) {
        const typeSelect = item.querySelector('.debt-type');
        const titleSpan = item.querySelector('.debt-title');
        const selectedOption = typeSelect.options[typeSelect.selectedIndex];
        let text = selectedOption.text;
        if (text.includes('(')) {
            text = text.split('(')[0].trim();
        }
        titleSpan.textContent = text;
    }

    window.removeDebtItem = function (id) {
        const item = document.querySelector(`.debt-item[data-id="${id}"]`);
        if (item) {
            item.remove();
            calculate();
        }
    };

    elements.addDebtBtn.addEventListener('click', addDebtItem);

    // --- Calculation Logic ---
    function calculateAnnualBurden(type, amount, rate, maturityYear, maturityMonth, graceMonths) {
        const annualInterest = amount * (rate / 100);
        let annualPrincipal = 0;
        let termYears = 0;

        switch (type) {
            case 'mortgage_amortized': termYears = 30; break;
            case 'mortgage_bullet': termYears = 10; break;
            case 'intermediate': termYears = 25; break;
            case 'jeonse_etc': termYears = 0; break; // Interest Only
            case 'jeonse_guarantee': termYears = 4; break;
            case 'credit': termYears = 5; break;
            case 'non_housing': termYears = 8; break;
            case 'other_collateral': termYears = 10; break;
            case 'long_card': termYears = 3; break;
            case 'other': termYears = 1; break;
            default: termYears = 5;
        }

        if (maturityYear && maturityMonth) {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            let diffYear = Number(maturityYear) - currentYear;
            let diffMonth = Number(maturityMonth) - currentMonth;
            let totalMonthsRemaining = (diffYear * 12) + diffMonth;
            if (graceMonths > 0) totalMonthsRemaining -= graceMonths;
            if (totalMonthsRemaining > 0) {
                termYears = totalMonthsRemaining / 12;
            }
        }

        if (termYears > 0) annualPrincipal = amount / termYears;
        if (type === 'jeonse_etc') annualPrincipal = 0;

        return annualPrincipal + annualInterest;
    }

    function checkGraduatedEligibility() {
        const isPolicy = elements.policyLoanCheck.checked;
        const graduatedOption = elements.mainLoanMethod.querySelector('option[value="graduated"]');
        let isEligible = isPolicy;

        if (isPolicy) {
            graduatedOption.text = "체증식 분할상환";
        } else {
            graduatedOption.text = "체증식 (정책대출 전용)";
        }

        if (isEligible) {
            graduatedOption.disabled = false;
        } else {
            graduatedOption.disabled = true;
            if (elements.mainLoanMethod.value === 'graduated') {
                elements.mainLoanMethod.value = 'equal_pi';
            }
        }
    }

    // --- Chart Logic ---
    let repaymentChart = null;

    function updateChart(mainLoanResult, existingDebtSchedule, years) {
        const ctx = document.getElementById('repaymentChart').getContext('2d');
        const labels = Array.from({ length: years }, (_, i) => `${i + 1}년차`);

        // Calculate Total Schedule for Line Chart
        const totalSchedule = mainLoanResult.total.map((val, i) => val + (existingDebtSchedule[i] || 0));

        if (repaymentChart) repaymentChart.destroy();

        repaymentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        type: 'line',
                        label: '월 상환 총액',
                        data: totalSchedule,
                        borderColor: 'rgba(251, 113, 133, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointBackgroundColor: 'rgba(251, 113, 133, 1)',
                        order: 0,
                        pointRadius: 2
                    },
                    {
                        label: '주담대 월 원금',
                        data: mainLoanResult.principal,
                        backgroundColor: '#38bdf8',
                        stack: 'Stack 0',
                        order: 1
                    },
                    {
                        label: '주담대 월 이자',
                        data: mainLoanResult.interest,
                        backgroundColor: '#818cf8',
                        stack: 'Stack 0',
                        order: 2
                    },
                    {
                        label: '기존 대출 월 상환액',
                        data: existingDebtSchedule,
                        backgroundColor: 'rgba(148, 163, 184, 0.4)',
                        stack: 'Stack 0',
                        order: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8',
                            callback: function (value) {
                                return (value / 10000).toLocaleString() + '만';
                            }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#e2e8f0',
                            font: { size: 11 },
                            boxWidth: 12,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) label += formatKoreanNumber(context.parsed.y);
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    function calculateMainLoanSchedule(maxLoan, rate, term, method) {
        const monthlyRate = (rate / 100) / 12;
        const totalMonths = term * 12;

        // Structure to return both principal and interest parts
        let result = {
            principal: [], // Average monthly principal for each year
            interest: [],   // Average monthly interest for each year
            total: []      // Total monthly payment for each year
        };

        if (maxLoan <= 0) {
            const zeros = Array(term).fill(0);
            return { principal: zeros, interest: zeros, total: zeros };
        }

        if (method === 'equal_pi') {
            const monthlyTotal = Math.floor(maxLoan * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1));
            let balance = maxLoan;

            for (let y = 0; y < term; y++) {
                let yearInterest = 0;
                let yearPrincipal = 0;
                for (let m = 0; m < 12; m++) {
                    const interest = balance * monthlyRate;
                    const principal = monthlyTotal - interest;
                    yearInterest += interest;
                    yearPrincipal += principal;
                    balance -= principal;
                }
                result.principal.push(Math.floor(yearPrincipal / 12));
                result.interest.push(Math.floor(yearInterest / 12));
                result.total.push(monthlyTotal);
            }
        } else if (method === 'equal_p') {
            let balance = maxLoan;
            const principalPart = maxLoan / totalMonths;
            for (let y = 0; y < term; y++) {
                let yearInterest = 0;
                for (let m = 0; m < 12; m++) {
                    yearInterest += (balance * monthlyRate);
                    balance -= principalPart;
                }
                const avgInterest = Math.floor(yearInterest / 12);
                const avgPrincipal = Math.floor(principalPart);
                result.principal.push(avgPrincipal);
                result.interest.push(avgInterest);
                result.total.push(avgPrincipal + avgInterest);
            }
        } else if (method === 'graduated') {
            const annualGrowth = 0.025;
            const g = Math.pow(1 + annualGrowth, 1 / 12) - 1;

            let initialPayment;
            if (Math.abs(monthlyRate - g) < 0.0000001) {
                initialPayment = maxLoan / totalMonths;
            } else {
                initialPayment = maxLoan * (monthlyRate - g) / (1 - Math.pow((1 + g) / (1 + monthlyRate), totalMonths));
            }

            let balance = maxLoan;
            for (let y = 0; y < term; y++) {
                let yearInterest = 0;
                let yearPrincipal = 0;
                for (let m = 0; m < 12; m++) {
                    const monthIdx = y * 12 + m;
                    const totalMonthly = initialPayment * Math.pow(1 + g, monthIdx);
                    const interest = balance * monthlyRate;
                    const principal = totalMonthly - interest;
                    yearInterest += interest;
                    yearPrincipal += principal;
                    balance -= principal;
                }
                result.principal.push(Math.floor(yearPrincipal / 12));
                result.interest.push(Math.floor(yearInterest / 12));
                result.total.push(Math.floor((yearPrincipal + yearInterest) / 12));
            }
        }
        return result;
    }

    function calculateExistingDebtSchedule(yearsToProject) {
        let schedule = Array(yearsToProject).fill(0);
        const debtItems = document.querySelectorAll('.debt-item');

        debtItems.forEach(item => {
            const amount = parseCurrency(item.querySelector('.debt-amount').value);
            const rate = Number(item.querySelector('.debt-rate').value) || 0;
            const type = item.querySelector('.debt-type').value;
            const maturityYear = item.querySelector('.debt-maturity-year').value;
            const graceMonths = Number(item.querySelector('.debt-grace').value) || 0;
            const isBullet = item.querySelector('.debt-bullet-check') ? item.querySelector('.debt-bullet-check').checked : false;

            let termYears = 0;
            switch (type) {
                case 'mortgage_amortized': termYears = 30; break;
                case 'mortgage_bullet': termYears = 10; break;
                case 'intermediate': termYears = 3; break;
                case 'jeonse_etc': termYears = 2; break;
                case 'jeonse_guarantee': termYears = 2; break;
                case 'credit': termYears = 5; break;
                case 'non_housing': termYears = 8; break;
                case 'other_collateral': termYears = 10; break;
                case 'long_card': termYears = 3; break;
                case 'other': termYears = 1; break;
                default: termYears = 5;
            }

            if (maturityYear) {
                const currentYear = new Date().getFullYear();
                termYears = Number(maturityYear) - currentYear;
                if (termYears < 0) termYears = 0;
            }

            const totalMonths = Math.max(1, Math.ceil(termYears * 12));
            const monthlyInterest = Math.floor(amount * (rate / 100) / 12);

            // Determine if this is a "Bullet" type loan
            // If grace period >= maturity, treat as bullet (interest only until maturity, then lump sum)
            const forceBullet = isBullet || ['jeonse_etc', 'mortgage_bullet', 'intermediate'].includes(type) || (graceMonths >= totalMonths);

            let monthlyPrincipal = 0;
            if (!forceBullet) {
                // Amortized: Principal = Total Amount / (Term - Grace)
                const amortizationMonths = Math.max(1, totalMonths - graceMonths);
                monthlyPrincipal = Math.floor(amount / amortizationMonths);
            }

            // Fill schedule
            for (let y = 0; y < Math.min(Math.ceil(termYears) + 1, yearsToProject); y++) {
                let yearPaymentSum = 0;

                for (let m = 0; m < 12; m++) {
                    const currentMonthIndex = (y * 12) + m;

                    if (currentMonthIndex < totalMonths) {
                        // 1. Interest (always paid during active term)
                        yearPaymentSum += monthlyInterest;

                        // 2. Amortized Principal (if not bullet and past grace)
                        if (!forceBullet && currentMonthIndex >= graceMonths) {
                            yearPaymentSum += monthlyPrincipal;
                        }
                    }

                    // 3. Bullet Spike at Maturity (last month of term)
                    if (forceBullet && currentMonthIndex === (totalMonths - 1)) {
                        yearPaymentSum += amount;
                    }
                }

                // Assign to schedule (yearly average monthly payment)
                if (y < yearsToProject) {
                    schedule[y] += Math.floor(yearPaymentSum / 12);
                }
            }
        });

        return schedule;
    }

    // --- Main Calc ---
    function calculate() {
        checkGraduatedEligibility();

        const price = parseCurrency(elements.housePrice.value) || 0;
        const ltv = Number(elements.ltvInput.value);
        const rate = Number(elements.interestRate.value);
        const term = Number(elements.loanTermInput.value);
        const income = parseCurrency(elements.annualIncome.value) || 0;
        const method = elements.mainLoanMethod.value;

        // Assets
        const cash = parseCurrency(elements.assetCash.value) || 0;
        const savings = parseCurrency(elements.assetSavings.value) || 0;
        const stock = parseCurrency(elements.assetStock.value) || 0;
        const other = parseCurrency(elements.assetOther.value) || 0;
        const totalAssets = cash + savings + stock + other;
        elements.totalAssetsDisplay.textContent = formatKoreanNumber(totalAssets);

        // Main Loan
        const maxLoan = Math.floor(price * (ltv / 100));

        // Costs
        const tax = Math.floor(price * 0.024);
        const fee = Math.floor(price * 0.004);
        const totalCost = tax + fee;

        const required = Math.max(0, price - maxLoan) + totalCost;
        const additional = Math.max(0, required - totalAssets);

        const monthlyRate = (rate / 100) / 12;
        const totalMonths = term * 12;

        let newMonthlyPay = 0;
        let methodText = "";

        if (monthlyRate > 0 && maxLoan > 0) {
            if (method === 'equal_pi') {
                newMonthlyPay = Math.floor(maxLoan * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1));
                methodText = "원리금균등";
            } else if (method === 'equal_p') {
                const principalPart = maxLoan / totalMonths;
                const interestPart = maxLoan * monthlyRate;
                newMonthlyPay = Math.floor(principalPart + interestPart);
                methodText = "원금균등 (첫회차)";
            } else if (method === 'graduated') {
                methodText = "체증식 (첫회차)";
                const annualGrowth = 0.025;
                const g = Math.pow(1 + annualGrowth, 1 / 12) - 1;
                if (Math.abs(monthlyRate - g) < 0.0000001) {
                    newMonthlyPay = maxLoan / totalMonths;
                } else {
                    newMonthlyPay = maxLoan * (monthlyRate - g) / (1 - Math.pow((1 + g) / (1 + monthlyRate), totalMonths));
                }
                newMonthlyPay = Math.floor(newMonthlyPay);
            }
        }

        const newAnnualRepayment = newMonthlyPay * 12;
        const totalYearlyInterest = Math.floor(maxLoan * (rate / 100));

        // Existing Debts
        let existingAnnualRepayment = 0;
        const debtItems = document.querySelectorAll('.debt-item');
        debtItems.forEach(item => {
            const amount = parseCurrency(item.querySelector('.debt-amount').value);
            const r = Number(item.querySelector('.debt-rate').value) || 0;
            const type = item.querySelector('.debt-type').value;
            const year = item.querySelector('.debt-maturity-year').value;
            const month = item.querySelector('.debt-maturity-month').value;
            const grace = Number(item.querySelector('.debt-grace').value) || 0;

            if (amount > 0) {
                existingAnnualRepayment += calculateAnnualBurden(type, amount, r, year, month, grace);
            }
        });

        const totalAnnualBurden = newAnnualRepayment + existingAnnualRepayment;
        let dsr = 0;
        if (income > 0) dsr = (totalAnnualBurden / income) * 100;

        // UI Updates
        updateResult(elements.maxLoanAmount, maxLoan);
        updateResult(elements.requiredCash, required);
        updateResult(elements.monthlyPayment, newMonthlyPay);
        elements.yearlyInterest.textContent = formatKoreanNumber(totalYearlyInterest);

        elements.taxAmount.textContent = formatKoreanNumber(tax);
        elements.feeAmount.textContent = formatKoreanNumber(fee);
        elements.commonMethodDisplay.textContent = methodText;

        if (price === 0) {
            elements.additionalCash.textContent = "-";
            elements.additionalCash.classList.remove('highlight-green', 'highlight-red');
        } else if (additional > 0) {
            elements.additionalCash.classList.remove('highlight-green');
            elements.additionalCash.classList.add('highlight-red');
            elements.additionalCash.textContent = formatKoreanNumber(additional);
        } else {
            elements.additionalCash.classList.remove('highlight-red');
            elements.additionalCash.classList.add('highlight-green');
            elements.additionalCash.textContent = "자금 충분 (0원)";
        }

        // Update "Current Assets" display in result section if added
        const assetDisplay = document.getElementById('my-assets-display');
        if (assetDisplay) {
            assetDisplay.textContent = formatKoreanNumber(totalAssets);
        }

        // Update Fund Bar Visualization
        updateFundBars(required, tax, fee, totalAssets, additional);

        if (income > 0) {
            elements.dsrValue.textContent = dsr.toFixed(2) + '%';
            elements.dsrCard.className = 'result-card dsr-card';

            let status = '';
            let msg = '';
            if (dsr <= 40) {
                elements.dsrCard.classList.add('dsr-safe');
                status = '안정권 (40% 이하)';
                msg = '1금융권 대출 승인 가능성이 높습니다.';
            } else if (dsr <= 50) {
                elements.dsrCard.classList.add('dsr-caution');
                status = '주의 (40~50%)';
                msg = '한도 감액 가능성이 있습니다.';
            } else {
                elements.dsrCard.classList.add('dsr-danger');
                status = '위험 (50% 초과)';
                msg = '대출 승인이 어려울 수 있습니다.';
            }
            elements.dsrStatus.textContent = status;
            elements.dsrText.textContent = msg;

        } else {
            elements.dsrValue.textContent = '0%';
            elements.dsrStatus.textContent = '-';
            elements.dsrText.textContent = '연 소득과 대출 정보를 입력하세요.';
        }

        // Update Chart (Always render to show visualization)
        const chartTerm = term > 0 ? term : 30; // Default to 30 years for initial display
        const mainSchedule = calculateMainLoanSchedule(maxLoan, rate, chartTerm, method);
        const debtSchedule = calculateExistingDebtSchedule(chartTerm);
        updateChart(mainSchedule, debtSchedule, chartTerm);
    }

    function updateResult(element, value) {
        if (element && !isNaN(value)) {
            const rounded = Math.round(value / 10000) * 10000;
            element.textContent = formatKoreanNumber(rounded);
        }
    }

    function updateFundBars(required, tax, fee, assets, additional) {
        const downPayment = required - tax - fee;
        const totalRequired = required;

        // Update display values
        const totalRequiredDisplay = document.getElementById('total-required-display');
        const downPaymentValue = document.getElementById('down-payment-value');
        const taxValue = document.getElementById('tax-value');
        const feeValue = document.getElementById('fee-value');
        const totalAssetsVisual = document.getElementById('total-assets-visual');
        const assetsValue = document.getElementById('assets-value');
        const additionalValue = document.getElementById('additional-value');

        const rTotalRequired = Math.round(totalRequired / 10000) * 10000;
        const rDownPayment = Math.round(downPayment / 10000) * 10000;
        const rTax = Math.round(tax / 10000) * 10000;
        const rFee = Math.round(fee / 10000) * 10000;
        const rAssets = Math.round(assets / 10000) * 10000;
        const rAdditional = Math.round(additional / 10000) * 10000;

        if (totalRequiredDisplay) totalRequiredDisplay.textContent = formatKoreanNumber(rTotalRequired);
        if (downPaymentValue) downPaymentValue.textContent = formatKoreanNumber(rDownPayment);
        if (taxValue) taxValue.textContent = formatKoreanNumber(rTax);
        if (feeValue) feeValue.textContent = formatKoreanNumber(rFee);
        if (totalAssetsVisual) totalAssetsVisual.textContent = formatKoreanNumber(rTotalRequired);
        if (assetsValue) assetsValue.textContent = formatKoreanNumber(rAssets);
        if (additionalValue) additionalValue.textContent = formatKoreanNumber(rAdditional);

        // Calculate percentages for required funds bar (should sum to 100%)
        if (totalRequired > 0) {
            const downPaymentPct = (downPayment / totalRequired) * 100;
            const taxPct = (tax / totalRequired) * 100;
            const feePct = (fee / totalRequired) * 100;

            document.getElementById('down-payment-bar').style.width = `${downPaymentPct}%`;
            document.getElementById('tax-bar').style.width = `${taxPct}%`;
            document.getElementById('fee-bar').style.width = `${feePct}%`;

            // Hide text if bar is too narrow (e.g., < 10% or 0)
            document.getElementById('down-payment-value').style.opacity = downPaymentPct < 10 ? '0' : '1';
            document.getElementById('tax-value').style.opacity = taxPct < 10 ? '0' : '1';
            document.getElementById('fee-value').style.opacity = feePct < 10 ? '0' : '1';

            // Calculate percentages for assets + additional bar
            const assetsPct = (assets / totalRequired) * 100;
            const additionalPct = (additional / totalRequired) * 100;

            document.getElementById('assets-bar').style.width = `${assetsPct}%`;
            document.getElementById('additional-bar').style.width = `${additionalPct}%`;

            document.getElementById('assets-value').style.opacity = assetsPct < 10 ? '0' : '1';
            document.getElementById('additional-value').style.opacity = additionalPct < 10 ? '0' : '1';
        } else {
            // No data - reset to minimum widths and hide text
            const bars = ['down-payment-bar', 'tax-bar', 'fee-bar', 'assets-bar', 'additional-bar'];
            bars.forEach(id => document.getElementById(id).style.width = '0%');
            const values = ['down-payment-value', 'tax-value', 'fee-value', 'assets-value', 'additional-value'];
            values.forEach(id => document.getElementById(id).style.opacity = '0');
        }
    }

    // --- Event Listeners ---
    elements.housePrice.addEventListener('input', (e) => handleCurrencyInput(e, elements.housePriceDisplay));
    elements.annualIncome.addEventListener('input', (e) => handleCurrencyInput(e, elements.annualIncomeDisplay));
    elements.mainLoanMethod.addEventListener('change', calculate);
    elements.policyLoanCheck.addEventListener('change', calculate);

    [elements.assetCash, elements.assetSavings, elements.assetStock, elements.assetOther].forEach(el =>
        el.addEventListener('input', (e) => handleCurrencyInput(e, null))
    );

    elements.ltvRange.addEventListener('input', (e) => syncInputs(e.target, elements.ltvInput));
    elements.ltvInput.addEventListener('input', (e) => syncInputs(e.target, elements.ltvRange));
    elements.loanTermRange.addEventListener('input', (e) => syncInputs(e.target, elements.loanTermInput));
    elements.loanTermInput.addEventListener('input', (e) => syncInputs(e.target, elements.loanTermRange));
    elements.interestRate.addEventListener('input', calculate);

    // Initial Calculation
    calculate();
});
