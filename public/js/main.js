document.addEventListener('DOMContentLoaded', function() {
    // Store OTP IDs
    let currentOtpId = null;
    let currentOtpType = null; // 'registration' or 'deletion'
    let otpVerified = false;
    // Add these variables at the top of your script
let registrationOtpId = null;
let deletionOtpId = null;
let adminLoginOtpId = null;

// Update the registration OTP request function
window.requestRegistrationOTP = async function() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    
    // ... validation code ...
    
    try {
        const result = await apiRequest('/otp/request-registration-otp', 'POST', {
            name,
            email,
            phone
        });

        if (result.success) {
            // Store OTP ID globally
            registrationOtpId = result.otpId;
            console.log('📝 Stored Registration OTP ID:', registrationOtpId);
            
            // ... rest of code ...
        }
    } catch (error) {
        // ... error handling ...
    }
};

// Update the registration OTP verification function
window.verifyRegistrationOTP = async function() {
    const otp = getOTPFromInputs('registration');
    
    if (otp.length !== 6) {
        showMessage('registerMessage', 'Please enter complete 6-digit OTP', 'error');
        return;
    }

    // Use the stored OTP ID
    if (!registrationOtpId) {
        showMessage('registerMessage', 'Please request OTP first', 'error');
        return;
    }

    console.log('🔐 Verifying with OTP ID:', registrationOtpId, 'OTP:', otp);

    try {
        const result = await apiRequest('/otp/verify-otp', 'POST', {
            otpId: registrationOtpId,
            otp: otp
        });

        if (result.success) {
            otpVerified = true;
            showMessage('registerMessage', '✅ OTP verified successfully! You can now submit registration.', 'success');
            document.getElementById('submitRegistration').disabled = false;
            document.getElementById('submitRegistration').classList.add('verified');
            if (otpTimer) {
                clearInterval(otpTimer);
            }
            
            // Clear OTP ID after successful verification
            registrationOtpId = null;
        } else {
            showMessage('registerMessage', `❌ ${result.message}`, 'error');
            clearOTPFields('registration');
            focusFirstOTPInput('registration');
        }
        
    } catch (error) {
        showMessage('registerMessage', '❌ OTP verification failed', 'error');
    }
};

// Do the same for deletion OTP
window.requestDeletionOTP = async function() {
    // ... existing code ...
    
    if (result.success) {
        deletionOtpId = result.otpId;
        console.log('📝 Stored Deletion OTP ID:', deletionOtpId);
        // ... rest of code ...
    }
};

window.verifyDeletionOTP = async function() {
    // ... existing code ...
    
    if (!deletionOtpId) {
        showMessage('deleteMessage', 'Please request OTP first', 'error');
        return;
    }
    
    console.log('🔐 Verifying deletion OTP ID:', deletionOtpId, 'OTP:', otp);
    
    // Use deletionOtpId in API call
    const verifyResult = await apiRequest('/otp/verify-otp', 'POST', {
        otpId: deletionOtpId,
        otp: otp
    });
    
    // ... rest of code ...
    // Navigation between sections
    document.getElementById('registerBtn').addEventListener('click', () => {
        setActiveSection('registerSection');
        updateButtonStates('registerBtn');
    });

    document.getElementById('deleteBtn').addEventListener('click', () => {
        setActiveSection('deleteSection');
        updateButtonStates('deleteBtn');
    });

    document.getElementById('adminBtn').addEventListener('click', () => {
        setActiveSection('adminSection');
        updateButtonStates('adminBtn');
        loadParticipants();
    });

    function setActiveSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
        clearMessages();
    }

    function updateButtonStates(activeButtonId) {
        const buttons = ['registerBtn', 'deleteBtn', 'adminBtn'];
        buttons.forEach(buttonId => {
            const btn = document.getElementById(buttonId);
            if (buttonId === activeButtonId) {
                btn.classList.add('btn-primary');
                btn.classList.remove('btn-outline');
                if (buttonId === 'adminBtn') btn.classList.remove('btn-warning');
            } else {
                btn.classList.remove('btn-primary');
                if (buttonId !== 'adminBtn') btn.classList.add('btn-outline');
            }
        });
    }

    function clearMessages() {
        document.querySelectorAll('.message').forEach(msg => {
            msg.style.display = 'none';
            msg.textContent = '';
        });
    }

    function showMessage(elementId, message, type = 'success') {
        const messageElement = document.getElementById(elementId);
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        messageElement.className = `message ${type}`;
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 5000);
        }
    }

    // OTP Input Handling
    function setupOTPInputs() {
        document.querySelectorAll('.otp-input').forEach((input, index, inputs) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                // Allow only numbers
                if (!/^\d*$/.test(value)) {
                    e.target.value = value.replace(/\D/g, '');
                    return;
                }
                
                if (e.target.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
                
                // Auto-submit when all 6 digits are entered
                if (index === inputs.length - 1 && e.target.value.length === 1) {
                    const allFilled = Array.from(inputs).every(input => input.value.length === 1);
                    if (allFilled) {
                        if (currentOtpType === 'registration') {
                            verifyRegistrationOTP();
                        } else if (currentOtpType === 'deletion') {
                            verifyDeletionOTP();
                        }
                    }
                }
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });
    }

    setupOTPInputs();

    // Get OTP from input fields
    function getOTPFromInputs(section) {
        const inputs = document.querySelectorAll(`#${section} .otp-input`);
        return Array.from(inputs).map(input => input.value).join('');
    }

    // Clear OTP fields
    function clearOTPFields(section) {
        document.querySelectorAll(`#${section} .otp-input`).forEach(input => {
            input.value = '';
        });
    }

    // Focus first OTP input
    function focusFirstOTPInput(section) {
        const firstInput = document.querySelector(`#${section} .otp-input`);
        if (firstInput) {
            firstInput.focus();
        }
    }

    // API Functions
    async function apiRequest(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`/api${endpoint}`, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Registration OTP Request
    window.requestRegistrationOTP = async function() {
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        
        if (!name || !phone || !email) {
            showMessage('registerMessage', 'Please enter name, phone and email first', 'error');
            return;
        }

        if (!/^\d{10}$/.test(phone)) {
            showMessage('registerMessage', 'Please enter a valid 10-digit phone number', 'error');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('registerMessage', 'Please enter a valid email address', 'error');
            return;
        }

        showMessage('registerMessage', '📨 Sending OTP...', 'info');
        document.getElementById('submitRegistration').disabled = true;

        try {
            const result = await apiRequest('/otp/request-registration-otp', 'POST', {
                name,
                email,
                phone
            });

            if (result.success) {
                currentOtpId = result.otpId;
                currentOtpType = 'registration';
                otpVerified = false;
                
                let message = '📧 OTP sent to your email';
                if (result.demoMode) {
                    message = '🔧 Demo Mode: Check console for OTP';
                    console.log(`📧 Demo OTP for ${email}: ${result.otpId}`);
                }
                
                showMessage('registerMessage', message, 'success');
                
                // Focus first OTP input
                setTimeout(() => {
                    focusFirstOTPInput('registerSection');
                }, 100);
                
            } else {
                showMessage('registerMessage', result.message || 'Failed to send OTP', 'error');
            }
            
        } catch (error) {
            showMessage('registerMessage', '❌ Failed to send OTP. Please try again.', 'error');
        }
    };

    // Verify Registration OTP
    window.verifyRegistrationOTP = async function() {
        const otp = getOTPFromInputs('registerSection');
        
        if (otp.length !== 6) {
            showMessage('registerMessage', 'Please enter complete 6-digit OTP', 'error');
            return;
        }

        if (!currentOtpId) {
            showMessage('registerMessage', 'Please request OTP first', 'error');
            return;
        }

        showMessage('registerMessage', '🔐 Verifying OTP...', 'info');

        try {
            const result = await apiRequest('/otp/verify-otp', 'POST', {
                otpId: currentOtpId,
                otp: otp
            });

            if (result.success) {
                otpVerified = true;
                showMessage('registerMessage', '✅ OTP verified successfully! You can now submit registration.', 'success');
                document.getElementById('submitRegistration').disabled = false;
                document.getElementById('submitRegistration').classList.add('verified');
            } else {
                showMessage('registerMessage', `❌ ${result.message}`, 'error');
                clearOTPFields('registerSection');
                focusFirstOTPInput('registerSection');
            }
            
        } catch (error) {
            showMessage('registerMessage', '❌ OTP verification failed', 'error');
        }
    };

    // Deletion OTP Request
    window.requestDeletionOTP = async function() {
        const rollNo = document.getElementById('deleteRollNo').value.trim();
        const email = document.getElementById('deleteEmail').value.trim();
        const phone = document.getElementById('deletePhone').value.trim();
        
        if (!rollNo || !email || !phone) {
            showMessage('deleteMessage', 'Please fill all fields first', 'error');
            return;
        }

        showMessage('deleteMessage', '📨 Sending OTP...', 'info');

        try {
            const result = await apiRequest('/otp/request-deletion-otp', 'POST', {
                rollNo,
                email,
                phone
            });

            if (result.success) {
                currentOtpId = result.otpId;
                currentOtpType = 'deletion';
                otpVerified = false;
                
                let message = '📧 OTP sent to your email';
                if (result.demoMode) {
                    message = '🔧 Demo Mode: Check console for OTP';
                    console.log(`📧 Demo deletion OTP: ${result.otpId}`);
                }
                
                showMessage('deleteMessage', message, 'success');
                
                // Focus first OTP input
                setTimeout(() => {
                    focusFirstOTPInput('deleteSection');
                }, 100);
                
            } else {
                showMessage('deleteMessage', result.message || 'Failed to send OTP', 'error');
            }
            
        } catch (error) {
            showMessage('deleteMessage', '❌ Failed to send OTP. Please try again.', 'error');
        }
    };

    // Verify Deletion OTP
    window.verifyDeletionOTP = async function() {
        const otp = getOTPFromInputs('deleteSection');
        
        if (otp.length !== 6) {
            showMessage('deleteMessage', 'Please enter complete 6-digit OTP', 'error');
            return;
        }

        if (!currentOtpId) {
            showMessage('deleteMessage', 'Please request OTP first', 'error');
            return;
        }

        showMessage('deleteMessage', '🔐 Verifying OTP and deleting...', 'info');

        try {
            // First verify OTP
            const verifyResult = await apiRequest('/otp/verify-otp', 'POST', {
                otpId: currentOtpId,
                otp: otp
            });

            if (verifyResult.success) {
                otpVerified = true;
                
                // Now delete the registration
                const rollNo = document.getElementById('deleteRollNo').value.trim();
                const deleteResult = await apiRequest('/participants/delete', 'POST', {
                    rollNo: rollNo
                });

                if (deleteResult.success) {
                    showMessage('deleteMessage', '✅ Registration deleted successfully!', 'success');
                    document.getElementById('deleteForm').reset();
                    clearOTPFields('deleteSection');
                    currentOtpId = null;
                    otpVerified = false;
                    
                    // Update admin table
                    if (document.getElementById('adminSection').classList.contains('active')) {
                        loadParticipants();
                    }
                } else {
                    showMessage('deleteMessage', `❌ ${deleteResult.message}`, 'error');
                }
                
            } else {
                showMessage('deleteMessage', `❌ ${verifyResult.message}`, 'error');
                clearOTPFields('deleteSection');
                focusFirstOTPInput('deleteSection');
            }
            
        } catch (error) {
            showMessage('deleteMessage', '❌ Deletion failed. Please try again.', 'error');
        }
    };

    // Registration form submission
    document.getElementById('registrationForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Check if OTP is verified
        if (!otpVerified) {
            showMessage('registerMessage', 'Please verify OTP first', 'error');
            return;
        }

        const name = document.getElementById('name').value.trim();
        const rollNo = document.getElementById('rollNo').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const department = document.getElementById('department').value;
        const batch = document.getElementById('batch').value.trim();
        const year = document.getElementById('year').value;
        const gender = document.getElementById('gender').value;
        
        // Get selected sports
        const sportsCheckboxes = document.querySelectorAll('input[name="sports"]:checked');
        const sports = Array.from(sportsCheckboxes).map(cb => cb.value);
        
        if (sports.length === 0) {
            showMessage('registerMessage', 'Please select at least one sport!', 'error');
            return;
        }
        
        // Additional validation
        if (!rollNo) {
            showMessage('registerMessage', 'Roll number is required', 'error');
            return;
        }

        if (!department) {
            showMessage('registerMessage', 'Please select department', 'error');
            return;
        }

        if (!batch.match(/^\d{4}-\d{4}$/)) {
            showMessage('registerMessage', 'Batch format: YYYY-YYYY', 'error');
            return;
        }

        if (!year) {
            showMessage('registerMessage', 'Please select year', 'error');
            return;
        }

        if (!gender) {
            showMessage('registerMessage', 'Please select gender', 'error');
            return;
        }

        showMessage('registerMessage', '📝 Registering...', 'info');

        try {
            // Submit registration
            const registrationData = {
                name,
                rollNo,
                phone,
                email,
                department,
                batch,
                year: parseInt(year),
                gender,
                sports
            };

            const result = await apiRequest('/participants/register', 'POST', registrationData);

            if (result.success) {
                showMessage('registerMessage', '✅ Registration successful! You have been registered for the sports day.', 'success');
                
                // Reset form
                this.reset();
                clearOTPFields('registerSection');
                document.getElementById('submitRegistration').disabled = true;
                document.getElementById('submitRegistration').classList.remove('verified');
                currentOtpId = null;
                otpVerified = false;
                
                // Update admin table if visible
                if (document.getElementById('adminSection').classList.contains('active')) {
                    loadParticipants();
                }
                
            } else {
                showMessage('registerMessage', `❌ ${result.message}`, 'error');
            }
            
        } catch (error) {
            showMessage('registerMessage', '❌ Registration failed. Please try again.', 'error');
        }
    });

    // Load participants for admin panel
    async function loadParticipants() {
        try {
            const result = await apiRequest('/participants/all');
            
            const tbody = document.getElementById('participantsBody');
            const noDataMessage = document.getElementById('noDataMessage');
            
            tbody.innerHTML = '';
            
            if (!result.success || !result.data || result.data.length === 0) {
                noDataMessage.style.display = 'flex';
                return;
            }
            
            noDataMessage.style.display = 'none';
            
            result.data.forEach((participant, index) => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${participant.name}</td>
                    <td>${participant.rollNo}</td>
                    <td>${participant.department}</td>
                    <td>${participant.batch}</td>
                    <td>Year ${participant.year}</td>
                    <td>${participant.gender}</td>
                    <td>${participant.sports.join(', ')}</td>
                    <td>${participant.email}</td>
                    <td>${participant.phone}</td>
                    <td>
                        <button class="btn-action delete-participant" data-roll="${participant.rollNo}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-participant').forEach(button => {
                button.addEventListener('click', function() {
                    const rollNo = this.getAttribute('data-roll');
                    if (confirm('Are you sure you want to delete this registration?')) {
                        deleteParticipant(rollNo);
                    }
                });
            });
            
            // Show count
            showMessage('adminMessage', `📊 Showing ${result.data.length} participants`, 'info');
            
        } catch (error) {
            console.error('Failed to load participants:', error);
            showMessage('adminMessage', '❌ Failed to load participants', 'error');
        }
    }

    async function deleteParticipant(rollNo) {
        try {
            const result = await apiRequest('/participants/delete', 'POST', { rollNo });
            
            if (result.success) {
                showMessage('adminMessage', '✅ Participant deleted successfully!', 'success');
                loadParticipants();
            } else {
                showMessage('adminMessage', `❌ ${result.message}`, 'error');
            }
            
        } catch (error) {
            showMessage('adminMessage', '❌ Failed to delete participant', 'error');
        }
    }

    // Initialize the page
    setActiveSection('registerSection');
    updateButtonStates('registerBtn');
    
    // Add some CSS for verified button
    const style = document.createElement('style');
    style.textContent = `
        .btn.verified {
            animation: pulse 2s infinite;
            background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%) !important;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        .otp-input:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
        }
    `;
    document.head.appendChild(style);
    if (verifyResult.success) {
        // Clear OTP ID after successful verification
        deletionOtpId = null;
    }
};
});
