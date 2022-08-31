import * as React from 'react';
import { useState } from 'react';
import { useCSVReader } from 'react-papaparse';
import { useUploadSourcesMutation } from '../../app/services/sourceApi';

export default function UploadSources(){
    const [file, setFile] = useState();

    const [uploadSources, result] = useUploadSourcesMutation();

    // const fileReader = new FileReader();
    const {CSVReader} = useCSVReader();
    const handleChange = (e) => {
        setFile(e.target.files[0])
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        // if (file) {
        //     fileReader.onload = function (event) {
        //        console.log(event.target.result)
        //        Papa.parse(event.target.result)
        //        const csvOutput = event.target.result;
        //     }

        //     fileReader.readAsText(file);
        // }
        // if (file) {

        // }
    }


    return (
        <div>
            <CSVReader onUploadAccepted={(results) => {
                console.log(results);
                // RTK Mutation
                uploadSources(results.data);
            }} >
                {({
                    getRootProps,
                    acceptedFile,
                    ProgressBar,
                    getRemoveFileProps,
                }) => (
                    <div >
                        <button type='button' {...getRootProps()} >
                            Upload CSV
                        </button>
                        <div >
                            {acceptedFile && acceptedFile.name}
                        </div>
                        <button {...getRemoveFileProps()} >
                            Remove File
                        </button>
                        <ProgressBar />
                    </div>
                )}
            </CSVReader>
            {/* {csvOutput ? console.log(csvOutPut) : console.log("no csv output")} */}
        </div>
    )
}