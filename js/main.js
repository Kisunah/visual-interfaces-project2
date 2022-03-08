d3.csv('data/formatted.csv')
    .then(_data => {
        console.log('Data loading complete');

        let data = _data;

        // Find all data items that don't have lat/long values and replace them with 999
        let numWithoutCoords = 0;
        data.forEach((item) => {
            if (item['decimalLatitude'] == 'null' || item['decimalLongitude'] == 'null') {
                item['decimalLatitude'] = 999;
                item['decimalLongitude'] = 999;
                numWithoutCoords++;
            }
            // Makes sure the lat/long are not strings
            item['decimalLatitude'] = +item['decimalLatitude'];
            item['decimalLongitude'] = +item['decimalLongitude'];
        });

        console.log(data);

        // Creates the map
        let map = new Map({parentElement: '#map'}, data);
    })
    .catch(err => console.error(err));