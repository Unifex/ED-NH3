import json
import requests
from bs4 import BeautifulSoup

json_data = []

## Works well with the search here:
## https://inara.cz/elite/nearest-bodies/
## Save the file as inara.html and run this script.
## Currently it writes to js/nh3.json and is for the Community Goal where we
## are looking for ammonia worlds.

# Load the inara.html file as a unicode string
with open('inara.html', 'r', encoding='utf-8') as f:
    # Read the file
    html = f.read()
    # parse the html
    soup = BeautifulSoup(html, 'html.parser')
    # Find the table
    table = soup.find('table', {'class': 'dataTable'})
    # Find all the rows
    rows = table.find_all('tr')
    # Loop through the rows
    for row in rows:
        system = {
            'name': '',
            'body': '',
            'coords': {
                'x': 0,
                'y': 0,
                'z': 0
            },
            'targets': [
                'Scanned'
            ]
        }
        # Find all the columns and parse out the data from the td tags.
        cols = row.find_all('td')
        cols = [ele.text.strip() for ele in cols]
        if len(cols) > 0:
            name = cols[0].replace('︎', '').strip()
            body = cols[1].replace(name, '').strip()
            system['name'] = name
            system['body'] = body
            # print the system name and body without a new line
            print(f'{name} {body} : ', end='')
            # Fetch the system coords from EDSM
            payload = dict(systemName=name, showCoordinates=1)
            response = requests.get(f'https://www.edsm.net/api-v1/system', params=payload)
            if response.status_code == 200:
                data = response.json()
                system['coords']['x'] = data['coords']['x']
                system['coords']['y'] = data['coords']['y']
                system['coords']['z'] = data['coords']['z']
                json_data.append(system)
                print(f'fetched')
            else:
                print(f'failed')

# Write the data to a json file
with open('js/nh3.json', 'w') as f:
    f.write(json.dumps(json_data))
