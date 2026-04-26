import "@/components/Layout/Content/userchat.scss";
function ImagesChat({ images }) {
  return (
    <ul className="message-images">
      {images.slice(0, 2).map((image, index) => (
        <div
          className={`image-item ${
            index === 1 && images.length > 2 ? "overlay" : ""
          }`}
          key={image._id}
        >
          <a download>
            <img src={image.fileUrl} alt="image" className="min-h-[100px]"/>
            {index === 1 && images.length > 2 && (
              <div className="image-counter">
                <span>+{images.length - 2}</span>
              </div>
            )}
          </a>
        </div>
      ))}
    </ul>
  );
}

export default ImagesChat;
