document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('employment_form');
    const steps = document.querySelectorAll('.form-step');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const progressBar = document.getElementById('progress_bar');
    const stepIndicators = document.querySelectorAll('.step-indicator span');

    let currentStep = 0;
    const totalSteps = steps.length;

    // Initialize UI
    updateUI();

    nextBtn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            currentStep++;
            updateUI();
            window.scrollTo(0, 0);
        } else {
            // Flash the first invalid input to draw attention (optional enhancement)
            const firstInvalid = steps[currentStep].querySelector(':invalid');
            if (firstInvalid) firstInvalid.focus();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            updateUI();
            window.scrollTo(0, 0);
        }
    });

    function updateUI() {
        // Show/Hide Steps
        steps.forEach((step, index) => {
            if (index === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // Update Progress Bar
        const progress = ((currentStep + 1) / totalSteps) * 100;
        progressBar.style.width = `${progress}%`;

        // Update Step Indicators
        stepIndicators.forEach((indicator, index) => {
            if (index <= currentStep) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });

        // Update Buttons
        prevBtn.disabled = currentStep === 0;

        if (currentStep === totalSteps - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
            nextBtn.textContent = 'Next';
        }
    }

    // Handle form submission via AJAX
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const formData = new FormData(form);

        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
            .then(response => {
                if (response.ok) {
                    // Success: Hide form elements and show success message
                    form.style.display = 'none';
                    document.querySelector('.progress-container').style.display = 'none';
                    document.querySelector('.form-header p').textContent = 'Process completed successfully.';
                    document.getElementById('success_message').style.display = 'block';
                    window.scrollTo(0, 0);
                } else {
                    return response.json().then(data => {
                        throw new Error(data.message || 'Submission failed');
                    });
                }
            })
            .catch(error => {
                console.error('Submission error:', error);
                alert('Oops! There was a problem submitting your form. Please try again or contact support.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Application';
            });
    });

    function validateStep(stepIndex) {
        const step = steps[stepIndex];
        const inputs = step.querySelectorAll('input, select, textarea');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.checkValidity()) {
                input.reportValidity();
                isValid = false;
                return; // Only report first error
            }
        });

        // Special Radio Button Check
        if (isValid) {
            const radioGroups = new Set();
            step.querySelectorAll('input[type="radio"][required]').forEach(r => radioGroups.add(r.name));

            for (const name of radioGroups) {
                const checked = step.querySelector(`input[name="${name}"]:checked`);
                if (!checked) {
                    // Try to find one to report on
                    const oneRadio = step.querySelector(`input[name="${name}"]`);
                    oneRadio.setCustomValidity('Please select an option.');
                    oneRadio.reportValidity();
                    // Reset custom validity immediately so it doesn't stick
                    oneRadio.addEventListener('input', () => oneRadio.setCustomValidity(''), { once: true });
                    isValid = false;
                    break;
                }
            }
        }

        return isValid;
    }

    // File Upload Limits
    const fileInput = document.getElementById('id_upload');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 10) {
                alert('You can only upload up to 10 files.');
                fileInput.value = '';
            }
        });
    }
});
