/**
 * Form Manager
 * Handles form validation, submission, and user feedback
 */
class FormManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupFormValidation();
        this.setupFloatingLabels();
        this.setupCharacterCounters();
    }

    setupFormValidation() {
        document.querySelectorAll('form').forEach(form => {
            // Add custom validation styles
            const style = document.createElement('style');
            style.textContent = `
                .form-group {
                    position: relative;
                    margin-bottom: 1.5rem;
                }

                .form-control {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 2px solid var(--light-dark);
                    border-radius: var(--border-radius);
                    transition: all 0.3s ease;
                }

                .form-control:focus {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px var(--primary-light);
                    outline: none;
                }

                .form-control.is-valid {
                    border-color: var(--secondary-color);
                }

                .form-control.is-invalid {
                    border-color: var(--accent-color);
                }

                .validation-message {
                    position: absolute;
                    bottom: -20px;
                    left: 0;
                    font-size: 0.875rem;
                    color: var(--accent-color);
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: all 0.3s ease;
                }

                .validation-message.show {
                    opacity: 1;
                    transform: translateY(0);
                }

                .floating-label {
                    position: absolute;
                    top: 50%;
                    left: 1rem;
                    transform: translateY(-50%);
                    transition: all 0.3s ease;
                    pointer-events: none;
                    color: var(--text-light);
                }

                .form-control:focus ~ .floating-label,
                .form-control:not(:placeholder-shown) ~ .floating-label {
                    top: 0;
                    transform: translateY(-50%) scale(0.85);
                    background: white;
                    padding: 0 0.5rem;
                }

                .character-counter {
                    position: absolute;
                    right: 1rem;
                    bottom: -20px;
                    font-size: 0.75rem;
                    color: var(--text-light);
                }

                .submit-button {
                    position: relative;
                    overflow: hidden;
                }

                .submit-button .spinner {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    display: none;
                }

                .submit-button.loading .spinner {
                    display: block;
                }

                .submit-button.loading .button-text {
                    visibility: hidden;
                }
            `;
            document.head.appendChild(style);

            // Setup form validation
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if (this.validateForm(form)) {
                    await this.handleSubmit(form);
                }
            });

            // Real-time validation
            form.querySelectorAll('input, textarea, select').forEach(input => {
                input.addEventListener('input', () => this.validateInput(input));
                input.addEventListener('blur', () => this.validateInput(input));
            });
        });
    }

    setupFloatingLabels() {
        document.querySelectorAll('.form-group input, .form-group textarea').forEach(input => {
            const label = document.createElement('label');
            label.className = 'floating-label';
            label.textContent = input.placeholder;
            input.parentNode.appendChild(label);
            
            // Remove placeholder to show floating label
            input.placeholder = '';
        });
    }

    setupCharacterCounters() {
        document.querySelectorAll('textarea[maxlength]').forEach(textarea => {
            const counter = document.createElement('div');
            counter.className = 'character-counter';
            
            const updateCounter = () => {
                const remaining = parseInt(textarea.maxLength) - textarea.value.length;
                counter.textContent = `${remaining} caractères restants`;
            };
            
            textarea.parentNode.appendChild(counter);
            textarea.addEventListener('input', updateCounter);
            updateCounter();
        });
    }

    validateInput(input) {
        const group = input.closest('.form-group');
        if (!group) return true;

        let isValid = input.checkValidity();
        const message = group.querySelector('.validation-message') || document.createElement('div');
        message.className = 'validation-message';

        // Custom validation
        if (input.type === 'email' && input.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = emailRegex.test(input.value);
            if (!isValid) {
                message.textContent = 'Veuillez entrer une adresse email valide';
            }
        }

        if (input.hasAttribute('minlength') && input.value) {
            const minLength = parseInt(input.getAttribute('minlength'));
            if (input.value.length < minLength) {
                isValid = false;
                message.textContent = `Minimum ${minLength} caractères requis`;
            }
        }

        // Update UI
        input.classList.toggle('is-valid', isValid && input.value);
        input.classList.toggle('is-invalid', !isValid && input.value);
        
        if (!isValid && input.value) {
            message.classList.add('show');
            group.appendChild(message);
        } else {
            message.classList.remove('show');
        }

        return isValid;
    }

    validateForm(form) {
        let isValid = true;
        form.querySelectorAll('input, textarea, select').forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
            }
        });
        return isValid;
    }

    async handleSubmit(form) {
        const submitButton = form.querySelector('[type="submit"]');
        if (!submitButton) return;

        // Show loading state
        submitButton.classList.add('loading');
        submitButton.disabled = true;

        try {
            // Collect form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Send email using mailto (opens email client)
            const subject = this.getEmailSubject(form, data);
            const body = this.formatEmailBody(form, data);
            const mailtoLink = `mailto:nebassel@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            
            // Open email client
            window.location.href = mailtoLink;
            
            // Simulate brief delay for UX
            await new Promise(resolve => setTimeout(resolve, 800));

            // Show success message
            if (window.notificationManager) {
                window.notificationManager.success('Votre client email s\'est ouvert avec le message pré-rempli !');
            } else {
                alert('Votre client email s\'est ouvert avec le message pré-rempli !');
            }
            
            // Don't reset form immediately in case user wants to make changes
            // form.reset();

            // Trigger success callback if defined
            if (typeof form.onSubmitSuccess === 'function') {
                form.onSubmitSuccess();
            }
        } catch (error) {
            if (window.notificationManager) {
                window.notificationManager.error('Une erreur est survenue. Veuillez réessayer.');
            } else {
                alert('Une erreur est survenue. Veuillez réessayer.');
            }
        } finally {
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
        }
    }

    getEmailSubject(form, data) {
        // Determine subject based on form type and data
        if (form.id === 'partnershipForm' || form.classList.contains('partnership-form')) {
            const partnershipType = data.partnershipType || 'Général';
            return `Demande de Partenariat - ${partnershipType}`;
        } else if (form.id === 'contactForm') {
            const subject = data.subject || 'Question générale';
            return `Contact HealthCompare - ${subject}`;
        } else if (form.id === 'subscribe-form') {
            return 'Demande d\'inscription à la newsletter HealthCompare';
        } else {
            return 'Message depuis HealthCompare';
        }
    }

    formatEmailBody(form, data) {
        let body = 'Bonjour,\\n\\nVoici les détails du formulaire soumis :\\n\\n';
        
        // Format the data nicely
        for (const [key, value] of Object.entries(data)) {
            if (value && value.trim()) {
                const label = this.getFieldLabel(key);
                body += `${label}: ${value}\\n`;
            }
        }
        
        body += '\\n\\nCordialement,\\nUn utilisateur de HealthCompare';
        return body;
    }

    getFieldLabel(fieldName) {
        const labels = {
            'name': 'Nom',
            'firstName': 'Prénom',
            'lastName': 'Nom de famille',
            'email': 'Email',
            'phone': 'Téléphone',
            'company': 'Entreprise',
            'subject': 'Sujet',
            'message': 'Message',
            'partnershipType': 'Type de partenariat',
            'budget': 'Budget estimé',
            'newsletter': 'Newsletter'
        };
        return labels[fieldName] || fieldName;
    }
}

// Ensure buttons with href navigate correctly
const buttonsWithHref = document.querySelectorAll('.btn[href]');
buttonsWithHref.forEach(button => {
    button.addEventListener('click', (event) => {
        const href = button.getAttribute('href');
        if (href && href !== '#') {
            window.location.href = href;
        }
    });
});

// Initialize form manager
window.formManager = new FormManager();