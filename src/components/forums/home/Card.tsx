import { usePath } from "../../../contexts/DispatchProvider";

import { Error } from "../../../assets";

interface CardProps {
  name: string;
  collectionId: string;
  src: string;
}

export const Card = (props: CardProps) => {
  const { forumURL } = usePath();

  const { name, collectionId, src } = props;

  return (
    <div className="cardContainer">
      <a
        className="cardContent"
        onClick={() => window.open(`${forumURL}/${collectionId}`, "_self")}>
        <div className="cardImage">
          <img src={src} />
        </div>
        <div className="cardName">{name}</div>
      </a>
      <div className="collectionId">{collectionId}</div>
    </div>
  );
};
