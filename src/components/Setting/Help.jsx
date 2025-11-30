import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { RiQuestionLine, RiCustomerService2Line, RiShieldCheckLine } from "react-icons/ri";
import { Link } from "react-router-dom";

function Help({ toggleSetting, settingOption, info }) {
  return (
    <div className="setting-container card mb-2 bg-[#0000] border-[1px] border-border-color">
      <Link
        className="text-heading-color"
        onClick={() => toggleSetting("help")}
      >
        <div className="flex items-center justify-between  bg-[#a6b0cf08] py-3 px-5">
          <h5 className="text-[14px] m-0">{info.header}</h5>
          <i className="ml-1">
            {settingOption.help ? <IoChevronUp /> : <IoChevronDown />}
          </i>
        </div>
      </Link>
      <div
        className={`setting-list help-list ${settingOption.help ? "show" : ""}`}
      >
        <div className="p-5">
          {/* FAQ */}
          <div className="py-3 border-b border-border-color last:border-none">
            <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-[var(--hover-dropdown-btn-bg-color)] transition cursor-pointer">
              <div className="flex items-center">
                <i className="text-[#7269ef] text-[18px] mr-3">
                  <RiQuestionLine />
                </i>
                <h5 className="text-[13px] text-body-color m-0">{info.faq}</h5>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--file-bg-color)] text-[#7269ef]">Guide</span>
            </div>
          </div>

          {/* Contact Support */}
          <div className="py-3 border-b border-border-color last:border-none">
            <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-[var(--hover-dropdown-btn-bg-color)] transition cursor-pointer">
              <div className="flex items-center">
                <i className="text-[#7269ef] text-[18px] mr-3">
                  <RiCustomerService2Line />
                </i>
                <h5 className="text-[13px] text-body-color m-0">{info.contact}</h5>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--file-bg-color)] text-[#7269ef]">Support</span>
            </div>
          </div>

          {/* Terms & Privacy */}
          <div className="py-3">
            <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-[var(--hover-dropdown-btn-bg-color)] transition cursor-pointer">
              <div className="flex items-center">
                <i className="text-[#7269ef] text-[18px] mr-3">
                  <RiShieldCheckLine />
                </i>
                <h5 className="text-[13px] text-body-color m-0">{info.policy}</h5>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--file-bg-color)] text-[#7269ef]">Policy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Help;
