import os
import smtplib
from email.message import EmailMessage
import dotenv

def send_email(to_email, subject, content, reply_to=None, *args, **kwargs):
    """Base function to send emails
    
    Args:
        to_email: Email address of the recipient
        subject: Email subject
        content: HTML content of the email
        reply_to: Optional reply-to email address
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    # Load environment variables
    dotenv.load_dotenv()
    
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = os.getenv("ORG_EMAIL_USER", 'noreply@120eaststate.org')
    msg['To'] = to_email
    
    if reply_to:
        msg['Reply-To'] = reply_to
    
    # Set the HTML content
    msg.add_alternative(content, subtype='html')
    
    try:
        # SMTP configuration
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        email_user = os.getenv("ORG_EMAIL_USER")
        # Use App Password for Gmail authentication
        email_pass = os.getenv("APP_PASS")

        if not email_user or not email_pass:
            print(f"Warning: Email credentials not found in environment variables (user: {email_user}, pass: {'set' if email_pass else 'not set'})")
            return False

        # Send the email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(email_user, email_pass)
            server.send_message(msg)
            
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False


def send_decision_email(to_email, decision, post_title=None, feedback=None, *args, **kwargs):
    """Send an email notification about a post approval or denial decision
    
    Args:
        to_email: Email address of the recipient
        decision: Decision status ('approved' or 'denied')
        post_title: The title of the post (optional)
        feedback: Feedback message (optional, used for denials)
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    subject = f'Your 120 East State Submission Was {decision.capitalize()}'
    
    # Create content based on decision
    if decision.lower() == "approved":
        content = f"""<html>
        <body>
            <h2>🎉 Congratulations!</h2>
            <p>Your submission to 120 East State has been <strong>approved</strong>.</p>
            {f'<p>Your post titled "<strong>{post_title}</strong>" is now visible on the site.</p>' if post_title else ''}
            <p>Thank you for contributing to our community!</p>
            <p>Visit <a href="https://one20es-frontend-ea37035e8ebf.herokuapp.com">our website</a> to see your post.</p>
            <p>—<br>The 120 East State Team</p>
        </body>
        </html>"""
    elif decision.lower() == "contact":
        # Special case for contact form email (feedback contains the full message)
        content = feedback
    else:
        # Add admin feedback if provided
        feedback_html = ""
        if feedback:
            feedback_html = f"""
            <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #d9534f; background-color: #f9f9f9;">
                <h3 style="margin-top: 0;">Feedback from our team:</h3>
                <p style="white-space: pre-line;">{feedback}</p>
            </div>
            """
            
        content = f"""<html>
        <body>
            <h2>Notice Regarding Your Submission</h2>
            <p>We've reviewed your submission to 120 East State.</p>
            {f'<p>Unfortunately, your post titled "<strong>{post_title}</strong>" has not been approved at this time.</p>' if post_title else ''}
            {feedback_html}
            <p>Common reasons for declined submissions include:</p>
            <ul>
                <li>Content not aligned with our community guidelines</li>
                <li>Insufficient information or details</li>
                <li>Quality concerns</li>
            </ul>
            <p>You're welcome to submit again with revised content.</p>
            <p>—<br>The 120 East State Team</p>
        </body>
        </html>"""
    
    # Use the base send_email function
    return send_email(to_email, subject, content)


def send_contact_form_email(to_email, name, email, message, *args, **kwargs):
    """Send an email from the contact form
    
    Args:
        to_email: Email address of the recipient (organization email)
        name: Name of the person submitting the contact form
        email: Email address of the sender
        message: Content of the message
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    subject = f'120 East State Contact Form: Message from {name}'
    
    # Create HTML content for better formatting
    content = f"""<html>
    <body>
        <h2>New Contact Form Message</h2>
        <p><strong>From:</strong> {name}</p>
        <p><strong>Email:</strong> <a href="mailto:{email}">{email}</a></p>
        <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #4a90e2; background-color: #f9f9f9;">
            <h3 style="margin-top: 0;">Message:</h3>
            <p style="white-space: pre-line;">{message}</p>
        </div>
        <p>This message was submitted through the 120 East State website contact form.</p>
    </body>
    </html>"""
    
    # Use the base send_email function with reply-to set to the sender's email
    return send_email(to_email, subject, content, reply_to=email)
