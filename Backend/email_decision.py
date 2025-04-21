import os
import smtplib
from email.message import EmailMessage
import dotenv

def send_decision_email(to_email, decision, post_title=None, feedback=None, *args, **kwargs):
    """Send an email notification about a post approval or denial decision
    
    Args:
        to_email: Email address of the recipient
        decision: Decision status ('approved' or 'denied')
        post_title: The title of the post (optional)
    
    Note:
        This uses Google App Password authentication. You need to:
        1. Set up 2-factor authentication on your Google account
        2. Generate an App Password specifically for this application
        3. Use that App Password in the EMAIL_PASS environment variable
    """
    # Load environment variables
    dotenv.load_dotenv()
    
    msg = EmailMessage()
    msg['Subject'] = f'Your 120 East State Submission Was {decision.capitalize()}'
    msg['From'] = os.getenv("EMAIL_USER", 'noreply@120eaststate.org')
    msg['To'] = to_email
    
    # Create more detailed email content based on the decision
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
    
    # Set the HTML content
    msg.add_alternative(content, subtype='html')
    
    try:
        # SMTP configuration
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        email_user = os.getenv("EMAIL_USER")
        # Use App Password for Gmail authentication
        email_pass = os.getenv("APP_PASS")

        if not email_user or not email_pass:
            print("Warning: Email credentials not found in environment variables")
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
