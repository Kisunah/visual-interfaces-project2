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

        let missingPoints = document.getElementById('missingPoints');
        missingPoints.innerText = `*There are ${numWithoutCoords} specimens without GPS coordinates\n*Not all specimens have complete data points, resulting in null values`;

        // Creates the map
        let map = new SpecimenMap({ parentElement: '#map' }, data);

        let minYear = 1859;
        let maxYear = 2017;

        let years = [];
        for (let i = minYear; i < maxYear + 1; i++) {
            years.push(i);
        }

        /*
        let timelineData = [];
        years.forEach((year) => {
            let count = 0;
            data.forEach((item) => {
                if (parseInt(item['year']) == year) count++;
            });
            let obj = {
                year: year,
                specimenCount: count
            };
            timelineData.push(obj);
        });

        let timeline = new Timeline({ parentElement: "#timeline" }, timelineData);
        */

        // Logic for creating the specimens collected by month bar chart
        let monthlyData = [];
        let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        months.forEach((month, idx) => {
            let obj = {
                month: month,
                count: 0
            };
            data.forEach((item) => {
                if (parseInt(item['month']) == idx + 1) obj.count += 1;
            });
            monthlyData.push(obj);
        });

        let monthChart = new monthBarChart({ parentElement: '#monthBarChart' }, monthlyData);

        // Logic for creating the phylum bar chart
        let phylumData = [];
        let phyla = ['Myxomycota', 'Ascomycota', 'Amoebozoa', 'Basidiomycota', 'Chytridiomycota', 'Zygomycota', 'Oomycota', 'Blastocladiomycota'];

        phyla.forEach((phylum) => {
            let obj = {
                phylum: phylum,
                count: 0
            }
            data.forEach((item) => {
                if (item['phylum'] == phylum) obj.count += 1;
            });
            phylumData.push(obj);
        });

        let phylumChart = new phylumBarChart({ parentElement: '#phylumBarChart' }, phylumData);

        // Logic for creating the specimens collected by each person chart
        let collectorData = [];
        let collectors = [];
        data.forEach((item) => {
            if (collectors.indexOf(item['recordedBy']) == -1) {
                collectors.push(item['recordedBy'])
            }
        });

        collectors.forEach((collector) => {
            let obj = {
                collector: collector,
                count: 0
            };
            data.forEach((item) => {
                if (item['recordedBy'] == collector && item['recordedBy'] != 's.n.') obj.count += 1;
            });
            collectorData.push(obj);
        });

        collectorData.sort(function(a, b) {
            return b.count - a.count
        });
        collectorData = collectorData.slice(0, 10);

        let collectorChart = new collectorBarChart({ parentElement: '#collectorBarChart' }, collectorData);

        // Logic for creating the chart that shows the total missing data specimens
        let gpsObject = {
            field: 'GPS Coordinates',
            totalSpecimens: 0,
            missing: 0,
            existing: 0
        };

        let dateObject = {
            field: 'Date',
            totalSpecimens: 0,
            missing: 0,
            existing: 0
        };
        data.forEach((item) => {
            if (item['decimalLatitude'] == 999 || item['decimalLongitude'] == 999) {
                gpsObject.missing += 1;
            } else {
                gpsObject.existing += 1;
            }

            if (item['eventDate'] == 'null') {
                dateObject.missing += 1;
            } else {
                dateObject.existing += 1;
            }
        });
        gpsObject.totalSpecimens = gpsObject.existing + gpsObject.missing;
        dateObject.totalSpecimens = dateObject.existing + dateObject.missing;
        let missingData = [gpsObject, dateObject];

        let missingChart = new missingDataChart({ parentElement: '#missingDataChart' }, missingData);
    })
    .catch(err => console.error(err));