import os

from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def index():
    nome = "icoma.com"
    return render_template("index.html", site=nome)


@app.route("/login")
def login():
    return render_template("login/login.html")

@app.route("/respiracao")
def respiracao():
    return render_template("pages/respiracao.html")


@app.route("/pausa")
def pausa():
    return render_template("pages/pausa.html")

def main():
    app.run(host="0.0.0.0", port = int(os.environ.get("PORT", 10000)))


if __name__ == "__main__":
    main()
    
def main():
    app.run(
        port=int(os.environ.get("PORT", 80)),
        debug=True
    )


if __name__ == "__main__":
    main()
