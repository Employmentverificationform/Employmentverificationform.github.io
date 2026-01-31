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

    // Cloudinary Configuration
    const CLOUDINARY_CLOUD_NAME = 'dz4mwhnxy';
    const CLOUDINARY_UPLOAD_PRESET = 'id_default';

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
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading files...';

        const fileInput = document.getElementById('id_upload');
        const files = fileInput.files;
        let uploadedUrls = [];

        try {
            if (files.length > 0) {
                uploadedUrls = await uploadFilesToCloudinary(files);
            }

            submitBtn.textContent = 'Submitting form...';

            const formData = new FormData(form);

            // Remove the actual file from the form data to keep submission small
            formData.delete('attachment[]');

            // Add the links instead
            if (uploadedUrls.length > 0) {
                formData.append('Attached Documents', uploadedUrls.join('\n'));
            }

            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                form.style.display = 'none';
                document.querySelector('.progress-container').style.display = 'none';
                document.querySelector('.form-header p').textContent = 'Process completed successfully.';
                document.getElementById('success_message').style.display = 'block';
                window.scrollTo(0, 0);
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Submission failed');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Oops! ' + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Application';
        }
    });

    async function uploadFilesToCloudinary(files) {
        const urls = [];
        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

        for (let i = 0; i < files.length; i++) {
            const formData = new FormData();
            formData.append('file', files[i]);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`File upload failed: ${errorData.error.message}`);
            }

            const data = await response.json();
            urls.push(data.secure_url);
        }
        return urls;
    }

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

    // File Upload Limits and Validation
    const fileInput = document.getElementById('id_upload');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            const MAX_FILES = 10;
            const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total

            if (files.length > MAX_FILES) {
                alert(`You can only upload up to ${MAX_FILES} files.`);
                fileInput.value = '';
                return;
            }

            let totalSize = 0;
            for (let i = 0; i < files.length; i++) {
                totalSize += files[i].size;
            }

            if (totalSize > MAX_TOTAL_SIZE) {
                alert('The total size of your attachments exceeds the 10MB limit. Please upload smaller files.');
                fileInput.value = '';
                return;
            }
        });
    }
});
