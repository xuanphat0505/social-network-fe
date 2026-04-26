import { RiDownload2Line, RiFileTextFill } from "react-icons/ri";

import "@/components/Layout/Content/userchat.scss";
function FilesChat({ files }) {
  return (
    <ul className="message-files mt-2">
      {files.map((file) => (
        <div
          key={file._id}
          className="max-w-[500px] flex items-center p-2 mb-2 bg-card-bg-color rounded-[.25rem]"
        >
          <div className="flex-shrink-0 h-12 w-12 mr-4">
            <div className="avatar-file ">
              <i>
                <RiFileTextFill />
              </i>
            </div>
          </div>
          <div className="flex-1">
            <h5
              className="text-left text-[14px] mb-1 truncate"
              style={{ maxWidth: "200px" }} // hoặc width cố định
            >
              {file.originalName}
            </h5>

            <p className="text-[13px] text-secondary-color text-left">
              {file.sizeMB} MB
            </p>
          </div>
          <ul
            className="ml-6 inline-flex items-center gap-2"
            style={{ width: "auto" }}
          >
            <a
              href={file.fileUrl}
              download
              className="text-[20px] text-secondary-color cursor-pointer p-[2px]"
            >
              <i>
                <RiDownload2Line />
              </i>
            </a>
          </ul>
        </div>
      ))}
    </ul>
  );
}

export default FilesChat;
