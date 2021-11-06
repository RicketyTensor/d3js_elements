import os
from flask import Flask, render_template, jsonify
import pandas
import json

app = Flask(__name__)

@app.route('/basic')
def basic_tree():
    # Transform data to json to submit to java script
    with open("flat.csv") as jf:
        df = pandas.read_csv(jf, header=0)  # json.load creates a dictionary
        chart_data = df.to_dict(orient='records')
        # chart_data = json.dumps(df.to_dict(orient='records'), indent=2)
        
    return render_template("basic.html", data=chart_data)

@app.route('/zoom')
def zoom_tree():
    # Transform data to json to submit to java script
    with open("hierarchical.json") as jf:
        json_data = json.load(jf)  # json.load creates a dictionary

    return render_template("zoom.html", data=json_data)

@app.route('/')
def index():

    # Render page
    return render_template("index.html")

if __name__=="__main__":
    app.run(debug=True, port=5000)
