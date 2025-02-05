
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('guide-access-form');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        company: document.getElementById('company').value,
        phone: document.getElementById('phone').value,
        timestamp: new Date().toISOString()
      };

      try {
        const response = await fetch('/submit-guide-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          // Show the hidden content
          document.getElementById('hidden-content').style.display = 'block';
          // Hide the form section
          document.getElementById('contact-form-section').style.display = 'none';
        } else {
          alert('There was an error submitting the form. Please try again.');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('There was an error submitting the form. Please try again.');
      }
    });
  }
});
