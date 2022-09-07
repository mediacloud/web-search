import * as React from 'react';
import { useState } from 'react';
import { useCSVReader } from 'react-papaparse';
import { useUploadSourcesMutation } from '../../app/services/sourceApi';

export default function UploadSources(props){
    const {collectionId} = props;

    const [uploadSources, result] = useUploadSourcesMutation();

    const {CSVReader} = useCSVReader();

    return (
        <div>
            <CSVReader config={{header: true}} onUploadAccepted={(results) => {
                console.log(results);
                // RTK Mutation
                uploadSources({'sources': results.data, 'collection_id': collectionId});
            }} >
                {({
                    getRootProps,
                    acceptedFile,
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
                    </div>
                )}
            </CSVReader>
            {/* {csvOutput ? console.log(csvOutPut) : console.log("no csv output")} */}
        </div>
    )
}