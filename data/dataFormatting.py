# import os
# import glob
# import pandas as pd

# os.chdir('C:/Users/sethc/Desktop/visual-interfaces/data')

# extension = 'csv'
# allFilenames = [i for i in glob.glob('*.{}'.format(extension))]

# combinedCsv = pd.concat([pd.read_csv(f) for f in allFilenames])
# combinedCsv.to_csv('aqiData.csv', index=False, encoding='utf-8-sig')

# import os
# import glob
# import pandas as pd

# os.chdir('C:/Users/sethc/Desktop/visual-interfaces-project2/data')

# extension = 'csv'
# file = pd.read_csv('occurrences.csv', encoding='latin')

# for row in len(file):
#     print(file[row])

import csv
import os

os.chdir('C:/Users/sethc/Desktop/visual-interfaces-project2/data')

with open('occurrences.csv') as csvFile:
    reader = csv.reader(csvFile)
    rows = []
    for row in reader:
        for i in range(len(row)):
            if row[i] == '':
                row[i] = 'null'
        rows.append(row)

with open('formatted.csv', 'w', newline='') as writeFile:
    writer = csv.writer(writeFile)
    for row in rows:
        writer.writerow(row)