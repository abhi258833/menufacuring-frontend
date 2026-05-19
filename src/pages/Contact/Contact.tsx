import "../../styles/contact.css";

const Contact = () => {
  return (
    <div className="contact-wrapper">
      <div className="contact-container">
        {/* Left Side: Map + Info */}
        <div className="contact-info-box">
          {/* Map Section */}
          <div className="contact-map-wrapper">
            <h2 className="form-title map-title">Contact Us</h2>
            <div className="contact-map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3508.3465709438606!2d77.03824307374327!3d28.438967292847536!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d186ec89f751b%3A0xdc2ab32fc4675cac!2sOptimark%E2%80%93The%20Medicity%2C%20Gurugram!5e0!3m2!1sen!2sin!4v1753265899495!5m2!1sen!2sin"
                width="600"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

            </div>
          </div>

          {/* Info Section */}
          <div className="company-info">
            <h2 className="company-title">Optimark</h2>
            <p className="company-address">
              📍 Optimark – The Medicity,<br />
              CH Baktawar Singh Road,<br />
              Sector 38, Gurugram, Haryana – 122001
            </p>
            <div className="company-contact">
              <p>📞 +91-880-000-1068</p>
              <p>📧 <a href="mailto:info@Optimark.org">info@Optimark.org</a></p>
            </div>
          </div>

        </div>

        {/* Right Side: Contact Form */}

      </div>
    </div>

  );
};

export default Contact;
