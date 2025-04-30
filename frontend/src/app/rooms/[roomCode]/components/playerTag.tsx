import React from "react";

const PlayerTag = (props: Readonly<{ text: string | null | undefined }>) => {
  return (
    <div className="bg-amber-700 max-w-50 flex flex-row jsutify-center items-center">
      {props.text}
    </div>
  );
};

export default PlayerTag;
