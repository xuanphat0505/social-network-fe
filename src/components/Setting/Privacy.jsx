import { Link } from "react-router-dom";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";

function Privacy({ toggleSetting, settingOption, info }) {
  return (
    <div className="setting-container card mb-2 bg-[#0000] border-[1px] border-border-color">
      <Link
        className="text-heading-color"
        onClick={() => toggleSetting("privacy")}
      >
        <div className="flex items-center justify-between  bg-[#a6b0cf08] py-3 px-5">
          <h5 className="text-[14px] m-0">{info.header}</h5>
          <i className="ml-1">
            {settingOption.privacy ? <IoChevronUp /> : <IoChevronDown />}
          </i>
        </div>
      </Link>
      <div
        className={`setting-list privacy-list ${
          settingOption.privacy ? "show" : ""
        }`}
      >
        <div className="p-5">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <h5>{info.photo}</h5>
              <div className="select-wrapper relative">
                <select className="custom-select bg-sidebar-bg text-heading-color pl-2 pr-8 py-1 rounded cursor-pointer border-[1px] border-border-color outline-none appearance-none">
                  <option value="everyone">Everyone</option>
                  <option value="selected">Selected</option>
                  <option value="nobody">Nobody</option>
                </select>
                <i className="select-icon absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-heading-color">
                  <IoChevronDown size={16} />
                </i>
              </div>
            </div>
          </div>
          <div className="py-4 border-t-[1px] border-border-color">
            <div className="flex items-center justify-between">
              <h5>{info.seen}</h5>
              <div className="ml-2">
                <div className="toggle-btn">
                  <span></span>
                </div>
              </div>
            </div>
          </div>
          <div className="py-4 border-t-[1px] border-border-color">
            <div className="flex items-center justify-between">
              <h5>{info.status}</h5>
              <div className="select-wrapper relative">
                <select className="custom-select bg-sidebar-bg text-heading-color pl-2 pr-8 py-1 rounded cursor-pointer border-[1px] border-border-color outline-none appearance-none">
                  <option value="everyone">Everyone</option>
                  <option value="selected">Selected</option>
                  <option value="nobody">Nobody</option>
                </select>
                <i className="select-icon absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-heading-color">
                  <IoChevronDown size={16} />
                </i>
              </div>
            </div>
          </div>
          <div className="py-4 border-t-[1px] border-border-color">
            <div className="flex items-center justify-between">
              <h5>{info.receipts}</h5>
              <div className="ml-2">
                <div className="toggle-btn">
                  <span></span>
                </div>
              </div>
            </div>
          </div>
          <div className="py-4 border-t-[1px] border-border-color">
            <div className="flex items-center justify-between">
              <h5>{info.groups}</h5>
              <div className="select-wrapper relative">
                <select className="custom-select bg-sidebar-bg text-heading-color pl-2 pr-8 py-1 rounded cursor-pointer border-[1px] border-border-color outline-none appearance-none">
                  <option value="everyone">Everyone</option>
                  <option value="selected">Selected</option>
                  <option value="nobody">Nobody</option>
                </select>
                <i className="select-icon absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-heading-color">
                  <IoChevronDown size={16} />
                </i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Privacy;
