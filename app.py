from flask import Flask, request, redirect
import psycopg2

app = Flask(__name__)

# PostgreSQL connection
conn = psycopg2.connect(
    host="localhost",
    database="contact",         # Change to your database name
    user="postgres",            # Your PostgreSQL username
    password="root"    # Your PostgreSQL password
)
cursor = conn.cursor()

@app.route("/", methods=["GET"])
def form():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Contact Us</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #0f0f0f;
                color: #fff;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
            }
            .form-container {
                background-color: #1a1a1a;
                padding: 40px;
                border-radius: 10px;
                width: 100%;
                max-width: 500px;
                box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
            }
            h2 {
                color: #e50914;
                margin-bottom: 20px;
            }
            input, textarea {
                width: 100%;
                padding: 10px;
                margin-bottom: 15px;
                background-color: #333;
                border: none;
                color: #fff;
                border-radius: 5px;
            }
            button {
                background-color: #e50914;
                color: white;
                padding: 12px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            }
            button:hover {
                background-color: #bf0810;
            }
        </style>
    </head>
    <body>
        <div class="form-container">
            <h2>Contact Us</h2>
            <form action="/submit" method="POST">
                <input type="text" name="name" placeholder="Your Name" required><br>
                <input type="email" name="email" placeholder="Your Email" required><br>
                <input type="text" name="subject" placeholder="Subject" required><br>
                <textarea name="message" placeholder="Your Message" rows="5" required></textarea><br>
                <button type="submit">Send Message</button>
            </form>
        </div>
    </body>
    </html>
    '''

@app.route("/submit", methods=["POST"])
def submit():
    name = request.form.get("name")
    email = request.form.get("email")
    subject = request.form.get("subject")
    message = request.form.get("message")

    cursor.execute("""
        INSERT INTO contact_messages (name, email, subject, message)
        VALUES (%s, %s, %s, %s)
    """, (name, email, subject, message))
    conn.commit()

    return "<h2 style='color: green; text-align: center; margin-top: 50px;'>Message received! Thank you. ✅</h2>"

if __name__ == "__main__":
    app.run(debug=True)
