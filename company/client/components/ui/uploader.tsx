import React from "react";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";
import { api_url, getJwt } from "../../../Constants";

registerPlugin(
  FilePondPluginImagePreview,
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize,
);

type Props = {
  allowMultiple?: boolean;
  refId: number | string;
  refName: string; // e.g. "api::print.print"
  fieldName: string; // e.g. "file" or "pdf_file"
  allowedTypes?: string[];
  displayType?: any;
  onUploaded?: (response: any) => void;
};

export default function Uploader(props: Props) {
  const maxFileSize = "100MB";

  const handleProcess = (
    fieldName: string,
    file: File,
    metadata: any,
    load: (uniqueFileId?: string) => void,
    error: (errorText?: string) => void,
    progress: (computable: boolean, loaded: number, total: number) => void,
    abort: () => void,
  ) => {
    const formData = new FormData();
    formData.append(props.allowMultiple ? "files[]" : "files", file);
    formData.append("refId", String(props.refId));
    formData.append("ref", props.refName);
    formData.append("field", props.fieldName);

    const request = new XMLHttpRequest();
    request.open("POST", `${api_url.replace(/\/$/, "")}/upload`);
    const jwt = getJwt();
    if (jwt) request.setRequestHeader("Authorization", `Bearer ${jwt}`);

    request.upload.onprogress = (e) => {
      progress(e.lengthComputable, e.loaded, e.total);
    }

    request.onload = async function () {
      if (request.status >= 200 && request.status < 300) {
        try {
          const responseData = JSON.parse(request.responseText);
          props.onUploaded?.(responseData);
        } catch {}
        load(request.responseText);
      } else {
        error("Upload failed");
      }
    };

    request.onerror = () => error("Upload error");
    request.onabort = () => abort();

    request.send(formData);

    return {
      abort: () => {
        request.abort();
        abort();
      },
    } as any;
  };

  const uploaderClassName =
    props.displayType === "circular" ? "filepond--circle" : "";

  return (
    <FilePond
      className={uploaderClassName}
      allowMultiple={props.allowMultiple}
      maxFileSize={maxFileSize}
      acceptedFileTypes={props.allowedTypes}
      server={{
        url: `${api_url.replace(/\/$/, "")}/upload`,
        process: handleProcess as any,
      }}
      stylePanelLayout={props.displayType as any}
    />
  );
}
