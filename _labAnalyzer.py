#!/usr/bin/env python

import os
import shutil
import pandas as pd
import xlsxwriter
from datetime import datetime
from datetime import date
from functools import reduce


# READ BELOW

# Author: Jonathan Goshu, 5/6/2022

# You need python to run this script. Download/intall python from https://www.python.org/downloads/
# Please ensure the pip modules: pandas and xlsxwriter are installed
# To do so enter the following lines in command prompt
#           1) python -m pip install pandas
#           2) python -m pip install xlsxwriter

# This script automatically grabs the current directory of the folder its in. If you do not have read/write privileges
#   for all files in the current directory then there will be an error.

# If your log files are in a network folder, map it first so you can access in CMD window
# to run, in CMD, issue 'python xxxx.py', it will create LAB_REPORTS folder and save the report there
# 


# Object for individual login
class login:
    def __init__(self, date, enter, exit):
        self.date = date
        self.enter = enter
        self.exit = exit


# Object for individual login
class lab:
    def __init__(self, extension):
        self.extension = extension  # string variable for recognizing log files specific to lab
        self.dateUsage = {}


def analyzer(folder):
    filefound = False
    fileDirectories = []
    fileNames = []

    # individual lab objects. FOR ADDITIONAL LABS --> JUST CREATE NEW VARIABLE AND ADD TO LABS LIST
    bh191a = lab(["ENG-CLA"])
    bh191b = lab(["ENG-CLB"])
    electric = lab(["ENG-EL"])
    studio = lab(["ENG-STUDIO"])
    media = lab(["ENG-MEDIA"])
    rdp_eng = lab(["PENGLAB20CIT01"])
    rdp_ele = lab(["PENGLAB20CIT02"])
    myapps_eng = lab(["PVDENGAZ", "pengaz"])
    myapps_ele = lab(["pvdengeleaz", "pengelaz"])
    myapps_gpu = lab(["pvdenggpuaz", "penggpuaz"])

    labs = [bh191a, bh191b, electric, studio, media, rdp_eng, rdp_ele, myapps_eng, myapps_ele,
            myapps_gpu]  # <- ADD NEW LABS HERE

    # # Process for replacing LAB_REPORTS folder from previous use
    # if os.path.isdir(folder + "\labREPORTS"):
    #     shutil.rmtree(folder + "\labREPORTS")
    # os.mkdir(folder + "\labREPORTS")

    # Process for retrieving all files in the specified directory
    for root, d_names, f_names in os.walk(folder):
        for f in f_names:
            fileNames.append(f.replace('.log', ''))
            # fileDirectories.append(os.path.join(root, f))

    fileDirectories = [f for f in os.listdir('.') if os.path.isfile(f)]

    # for each in fileDirectories:
    #     print(each)

    fileCounter = 0  # Counter for files corresponding to labs currently being analyzed
    for currentLab in labs:
        index = 0
        for currentDirectory in fileDirectories:
            for extension in currentLab.extension:
                if extension in currentDirectory:
                    filefound = True
                    fileCounter += 1
                    f = open(currentDirectory, 'r')
                    lines = f.readlines()
                    # Indicate current file being processed
                    # print("working on " + currentDirectory.replace(
                    #  "\\files.brown.edu\dfs\Engineering_Shared\Logs\LabLogin\\archive\\20220127", ""))
                    print("working on " + repr(currentDirectory.rsplit("\\", 1)[-1]))
                    line_iterator = 0

                    while line_iterator < len(lines):
                        tokens = lines[line_iterator].split()  # String line for login entry

                        tokens[2] = datetime.strptime(tokens[2], '%m/%d/%Y')  # reformat string date entry

                        # This version only counts the number of logins regardless of user behavior
                        if tokens[0] == "Login":
                            if tokens[2] in currentLab.dateUsage:
                                currentLab.dateUsage[tokens[2]] = currentLab.dateUsage[tokens[2]] + 1
                            else:
                                currentLab.dateUsage[tokens[2]] = 1

                        line_iterator += 1

    if not filefound:
        print("Error: No Target File Found")  # Error message if no files were parsed
        quit()

    final_dataframes = []

    # Create data frames for each lab
    for room in labs:
        final_dataframes.append(pd.DataFrame.from_dict(room.dateUsage, orient='index', columns=[room.extension[0]]))

    # Combine lab dataframes and format
    finalChart = pd.concat(final_dataframes, axis=1)
    finalChart = finalChart.sort_index()
    finalChart.index = finalChart.index.strftime('%m/%d/%Y')
    finalChart.fillna(0, inplace=True)
    finalChart['Total'] = finalChart.sum(axis=1)  # append row totals column

    # Add date of runtime to file name
    today = date.today()
    today = today.strftime("%m/%d/%y")
    today = today.replace("/", "-")

    writer = pd.ExcelWriter(folder + "\LAB_REPORTS\LAB_REPORT_UPDATED_FOR_" + today + ".xlsx", engine='xlsxwriter')
    finalChart.to_excel(writer, sheet_name='TABLE')
    workbook = writer.book

    worksheet = writer.sheets['TABLE']
    worksheet.set_column(1, len(labs), 15)

    # Create table on new sheet
    worksheet = workbook.add_worksheet('RESULTS')
    barChart = workbook.add_chart({'type': 'column'})
    lineChart = workbook.add_chart({'type': 'line'})
    lineChartTwo = workbook.add_chart({'type': 'line'})

    # if add/remove labs, update the 'Total' colum letter accordingly, such as $L$ => $M$
    max_row = str(len(finalChart.index) + 1)  # automatically adjust chart range of values
    barChart.add_series({'categories': ('=TABLE!$A$2:$A$' + max_row), 'values': ('=TABLE!$L$2:$L$' + max_row),
                         'name': 'Total Logins'})

    # Total bar chart
    barChart.set_x_axis({'name': 'Date'})
    barChart.set_y_axis({'name': 'Amount of Users',
                         'major_gridlines': {'visible': False}})

    worksheet.insert_chart('A1', barChart, {'x_scale': 5, 'y_scale': 1.5})


    # LineChart 1. you can add/remove labs here
    lineChart.set_title({'name': 'Lab Usage - Physical'})

    lineChart.set_x_axis({'name': 'Date'})
    lineChart.set_y_axis({'name': 'Amount of Users',
                          'major_gridlines': {'visible': False}})

    lineChart.add_series({'categories': ('=TABLE!$A$2:$A$' + max_row), 'values': ('=TABLE!$B$2:$B$' + max_row),
                          'name': 'ENG-CLA'})
    lineChart.add_series({'categories': ('=TABLE!$A$2:$A$' + max_row), 'values': ('=TABLE!$C$2:$C$' + max_row),
                          'name': 'ENG-CLB'})
    lineChart.add_series({'categories': ('=TABLE!$A$2:$A$' + max_row), 'values': ('=TABLE!$D$2:$D$' + max_row),
                          'name': 'ENG-EL'})
    lineChart.add_series({'categories': ('=TABLE!$A$2:$A$' + max_row), 'values': ('=TABLE!$E$2:$E$' + max_row),
                          'name': 'ENG-STUDIO'})
    lineChart.add_series({'categories': ('=TABLE!$A$2:$A$' + max_row), 'values': ('=TABLE!$F$2:$F$' + max_row),
                          'name': 'ENG-MEDIA'})

    worksheet.insert_chart('A24', lineChart, {'x_scale': 5, 'y_scale': 3})


    # LineChart 2. you can add/remove labs here

    lineChartTwo.set_title({'name': 'Lab Usage - Virtual'})

    lineChartTwo.set_x_axis({'name': 'Date'})
    lineChartTwo.set_y_axis({'name': 'Amount of Users',
                             'major_gridlines': {'visible': False}})

    lineChartTwo.add_series({'categories': ('=TABLE!$A$2:$A$' + max_row), 'values': ('=TABLE!$G$2:$G$' + max_row),
                             'name': 'PENGLAB20CIT01'})
    lineChartTwo.add_series({'categories': ('=TABLE!$A$2:$A$' + max_row), 'values': ('=TABLE!$H$2:$H$' + max_row),
                             'name': 'PENGLAB20CIT02'})
    lineChartTwo.add_series({'categories': ('=TABLE!$A$2:$A$' + max_row), 'values': ('=TABLE!$I$2:$I$' + max_row),
                             'name': 'ENG-Virtual'})  # renamed to ENG-Virtual
    lineChartTwo.add_series({'categories': ('=TABLE!$A$2:$A$' + max_row), 'values': ('=TABLE!$J$2:$J$' + max_row),
                             'name': 'ELE-Virtual'})  # renamed to ELE-Virtual
    lineChartTwo.add_series({'categories': ('=TABLE!$A$2:$A$' + max_row), 'values': ('=TABLE!$K$2:$K$' + max_row),
                             'name': 'GPU-Virtual'})  # renamed to GPU-Virtual

    worksheet.insert_chart('A68', lineChartTwo, {'x_scale': 5, 'y_scale': 3})

    writer.save()

    # Print folder information
    print("\nTOTAL AMOUNT OF FILES: " + str(len(fileDirectories)) + "")  # Indicate total amount of files in folder
    print("TARGET FILE AMOUNT: " + str(fileCounter))


def __main__():
    filepath = os.getcwd()
    analyzer(filepath)


__main__()
