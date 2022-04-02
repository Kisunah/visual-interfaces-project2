d3.csv('data/formatted.csv')
    .then(_data => {
        console.log('Data loading complete');

        let filters = {
            months: [],
            phyla: [],
            collectors: [],
            missingData: [],
            years: []
        };

        let data = _data;

        // Find all data items that don't have lat/long values and replace them with 999
        data.forEach((item) => {
            if (item['decimalLatitude'] == 'null' || item['decimalLongitude'] == 'null') {
                item['decimalLatitude'] = 999;
                item['decimalLongitude'] = 999;
            }
            // Makes sure the lat/long are not strings
            item['decimalLatitude'] = +item['decimalLatitude'];
            item['decimalLongitude'] = +item['decimalLongitude'];
        });

        // Creates the map
        let map = new SpecimenMap({ parentElement: '#map' }, data);

        let minYear = 1859;
        let maxYear = 2017;

        let years = [];
        for (let i = minYear; i < maxYear + 1; i++) {
            years.push(i);
        }

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

        collectorData.sort(function (a, b) {
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

        let resetButton = document.getElementById('resetButton');

        resetButton.addEventListener('click', () => {
            for (let filter in filters) {
                filters[filter] = [];
            }

            let mapData = prepareMapData(data, filters);
            let monthData = prepareMonthData(data, filters);
            let phylumData = preparePhylumData(data, filters);
            let collectorData = prepareRecorderData(data, filters);
            let missingData = prepareMissingData(data, filters);

            let enabled = true;

            d3.selectAll('.on')
                .attr('class', 'off');

            map.updateChart(mapData);
            monthChart.updateChart(monthData, enabled);
            phylumChart.updateChart(phylumData, enabled);
            collectorChart.updateChart(collectorData, enabled);
            missingChart.updateChart(missingData, enabled);
        });

        document.addEventListener('timelineFilter', (event) => {
            let startYear = event.detail.begin;
            let endYear = event.detail.end;

            filters.years = [startYear, endYear];
            let mapData = prepareMapData(data, filters);
            map.updateChart(mapData);
        });

        document.addEventListener('monthFilter', (event) => {
            filters.months = event.detail;

            let mapData = prepareMapData(data, filters);
            let phylumData = preparePhylumData(data, filters);
            let collectorData = prepareRecorderData(data, filters);
            let missingData = prepareMissingData(data, filters);

            let enabled = false;
            if (filters.months.length == 0) enabled = true; 

            map.updateChart(mapData);
            phylumChart.updateChart(phylumData, enabled);
            collectorChart.updateChart(collectorData, enabled);
            missingChart.updateChart(missingData, enabled);
        });

        document.addEventListener('phylumFilter', (event) => {
            filters.phyla = event.detail;

            let mapData = prepareMapData(data, filters);
            let monthData = prepareMonthData(data, filters);
            let collectorData = prepareRecorderData(data, filters);
            let missingData = prepareMissingData(data, filters);

            let enabled = false;
            if (filters.phyla.length == 0) enabled = true;

            map.updateChart(mapData);
            monthChart.updateChart(monthData, enabled);
            collectorChart.updateChart(collectorData, enabled);
            missingChart.updateChart(missingData, enabled);
        });

        document.addEventListener('collectorFilter', (event) => {
            filters.collectors = event.detail;

            let mapData = prepareMapData(data, filters);
            let monthData = prepareMonthData(data, filters);
            let phylumData = preparePhylumData(data, filters);
            let missingData = prepareMissingData(data, filters);

            let enabled = false;
            if (filters.collectors.length == 0) enabled = true;

            map.updateChart(mapData);
            monthChart.updateChart(monthData, enabled);
            phylumChart.updateChart(phylumData, enabled);
            missingChart.updateChart(missingData, enabled);
        });

        document.addEventListener('missingFilter', (event) => {
            filters.missingData = event.detail;

            let mapData = prepareMapData(data, filters);
            let monthData = prepareMonthData(data, filters);
            let phylumData = preparePhylumData(data, filters);
            let collectorData = prepareRecorderData(data, filters);

            let enabled = false;
            if (filters.missingData.length == 0) enabled = true;
            
            map.updateChart(mapData);
            monthChart.updateChart(monthData, enabled);
            phylumChart.updateChart(phylumData, enabled);
            collectorChart.updateChart(collectorData, enabled);
        });
    })
    .catch(err => console.error(err));

function prepareMapData(data, filters) {
    function filterByMonth(item) {
        if (filters.months.indexOf(item['month']) != -1) {
            return true;
        }
        return false;
    }

    function filterByPhylum(item) {
        if (filters.phyla.indexOf(item['phylum']) != -1) {
            return true;
        }
        return false;
    }

    function filterByCollector(item) {
        if (filters.collectors.indexOf(item['recordedBy']) != -1) {
            return true;
        }
        return false;
    }

    function filterByMissing(item) {
        if (filters.missingData.indexOf('GPS Coordinates') != -1) {
            if (item['decimalLatitude'] == 999 || item['decimalLongitude'] == 999) {
                return true;
            }
        }

        if (filters.missingData.indexOf('Date') != -1) {
            if (item['eventDate'] == 'null') {
                return true;
            }
        }

        return false;
    }

    function filterByYear(item) {
        if (parseInt(item['year']) >= filters.years[0] && parseInt(item['year']) <= filters.years[1])  {
            return true;
        }
        return false;
    }

    let mapData = data;

    if (filters.months.length > 0) mapData = mapData.filter(filterByMonth);
    if (filters.phyla.length > 0) mapData = mapData.filter(filterByPhylum);
    if (filters.collectors.length > 0) mapData = mapData.filter(filterByCollector);
    if (filters.missingData.length > 0) mapData = mapData.filter(filterByMissing);
    if (filters.years.length > 0) mapData = mapData.filter(filterByYear);

    return mapData;
}

function prepareMonthData(data, filters) {
    let monthlyData = [];
    let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let monthMap = {
        'January': '1',
        'February': '2',
        'March': '3',
        'April': '4',
        'May': '5',
        'June': '6',
        'July': '7',
        'August': '8',
        'September': '9',
        'October': '10',
        'November': '11',
        'December': '12'
    };

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

    if (filters.phyla.length > 0) {
        monthlyData.forEach((month) => {
            data.forEach((item) => {
                if (item['month'] == monthMap[month.month] && filters.phyla.indexOf(item['phylum']) == -1) {
                    month.count -= 1;
                }
            });
        });
    }

    if (filters.collectors.length > 0) {
        monthlyData.forEach((month) => {
            data.forEach((item) => {
                if (item['month'] == monthMap[month.month] && filters.collectors.indexOf(item['recordedBy']) == -1) {
                    month.count -= 1;
                }
            });
        });
    }

    if (filters.missingData.length > 0) {
        monthlyData.forEach((month) => {
            data.forEach((item) => {
                let flag = false;
                if (item['month'] == monthMap[month.month]) {
                    if (filters.missingData.indexOf('GPS Coordinates') != -1) {
                        if (item['decimalLatitude'] != 999 || item['decimalLongitude'] != 999) {
                            month.count -= 1;
                            flag = true;
                        }
                    }
                    if (filters.missingData.indexOf('Date') != -1 && !flag) {
                        if (item['eventDate'] != 'null') {
                            month.count -= 1;
                        }
                    }
                }
            });
        });
    }

    return monthlyData;
}

function preparePhylumData(data, filters) {
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

    if (filters.months.length > 0) {
        phylumData.forEach((phyla) => {
            data.forEach((item) => {
                if (item['phylum'] == phyla.phylum && filters.months.indexOf(item['month']) == -1) phyla.count -= 1;
            });
        });
    }

    if (filters.collectors.length > 0) {
        phylumData.forEach((phyla) => {
            data.forEach((item) => {
                if (item['phylum'] == phyla.phylum && filters.collectors.indexOf(item['recordedBy']) == -1) phyla.count -= 1;
            });
        });
    }

    if (filters.missingData.length > 0) {
        phylumData.forEach((phyla) => {
            data.forEach((item) => {
                if (item['phylum'] == phyla.phylum) {
                    let flag = false;
                    if (filters.missingData.indexOf('GPS Coordinates') != -1) {
                        if (item['decimalLatitude'] != 999 || item['decimalLongitude'] != 999) {
                            phyla.count -= 1;
                            flag = true;
                        }
                    }
                    if (filters.missingData.indexOf('Date') != -1 && !flag) {
                        if (item['eventDate'] != 'null') {
                            phyla.count -= 1;
                        }
                    }
                }
            });
        });
    }

    return phylumData;
}

function prepareRecorderData(data, filters) {
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

    collectorData.sort(function (a, b) {
        return b.count - a.count
    });
    collectorData = collectorData.slice(0, 10);

    if (filters.months.length > 0) {
        collectorData.forEach((collector) => {
            data.forEach((item) => {
                if (item['recordedBy'] == collector.collector && filters.months.indexOf(item['month']) == -1) collector.count -= 1;
            });
        });
    }

    if (filters.phyla.length > 0) {
        collectorData.forEach((collector) => {
            data.forEach((item) => {
                if (item['recordedBy'] == collector.collector && filters.phyla.indexOf(item['phylum']) == -1) collector.count -= 1;
            });
        });
    }

    if (filters.missingData.length > 0) {
        collectorData.forEach((collector) => {
            data.forEach((item) => {
                if (item['recordedBy'] == collector.collector) {
                    let flag = false
                    if (filters.missingData.indexOf('GPS Coordinates') != -1) {
                        if (item['decimalLatitude'] != 999 || item['decimalLongitude'] != 999) {
                            collector.count -= 1;
                            flag = true;
                        }
                    }
                    if (filters.missingData.indexOf('Date') != -1 && !flag) {
                        if (item['eventDate'] != 'null') {
                            collector.count -= 1;
                        }
                    }
                }
            });
        });
    }

    return collectorData;
}

function prepareMissingData(data, filters) {
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

    if (filters.months.length > 0) {
        missingData.forEach((missing) => {
            data.forEach((item) => {
                if (missing.field == 'GPS Coordinates') {
                    if (item['decimalLatitude'] == 999 || item['decimalLongitude'] == 999) {
                        if (filters.months.indexOf(item['month']) == -1) {
                            missing.missing -= 1;
                        }
                    } else {
                        if (filters.months.indexOf(item['month']) == -1) {
                            missing.existing -= 1;
                        }
                    }
                }

                if (missing.field == 'Date') {
                    if (item['eventDate'] == 'null') {
                        if (filters.months.indexOf(item['month']) == -1) {
                            missing.missing -= 1;
                        }
                    } else {
                        if (filters.months.indexOf(item['month']) == -1) {
                            missing.existing -= 1;
                        }
                    }
                }
            });
            missing.totalSpecimens = missing.missing + missing.existing;
        });
    }

    if (filters.phyla.length > 0) {
        missingData.forEach((missing) => {
            data.forEach((item) => {
                if (missing.field == 'GPS Coordinates') {
                    if (item['decimalLatitude'] == 999 || item['decimalLongitude'] == 999) {
                        if (filters.phyla.indexOf(item['phylum']) == -1) {
                            missing.missing -= 1;
                        }
                    } else {
                        if (filters.phyla.indexOf(item['phylum']) == -1) {
                            missing.existing -= 1;
                        }
                    }
                }

                if (missing.field == 'Date') {
                    if (item['eventDate'] == 'null') {
                        if (filters.phyla.indexOf(item['phylum']) == -1) {
                            missing.missing -= 1;
                        }
                    } else {
                        if (filters.phyla.indexOf(item['phylum']) == -1) {
                            missing.existing -= 1;
                        }
                    }
                }
            });
            missing.totalSpecimens = missing.missing + missing.existing;
        });
    }

    if (filters.collectors.length > 0) {
        missingData.forEach((missing) => {
            data.forEach((item) => {
                if (missing.field == 'GPS Coordinates') {
                    if (item['decimalLatitude'] == 999 || item['decimalLongitude'] == 999) {
                        if (filters.collectors.indexOf(item['recordedBy']) == -1) {
                            missing.missing -= 1;
                        }
                    } else {
                        if (filters.collectors.indexOf(item['recordedBy']) == -1) {
                            missing.existing -= 1;
                        }
                    }
                }

                if (missing.field == 'Date') {
                    if (item['eventDate'] == 'null') {
                        if (filters.collectors.indexOf(item['recordedBy']) == -1) {
                            missing.missing -= 1;
                        }
                    } else {
                        if (filters.collectors.indexOf(item['recordedBy']) == -1) {
                            missing.existing -= 1;
                        }
                    }
                }
            });
            missing.totalSpecimens = missing.missing + missing.existing;
        });
    }

        return missingData;
}