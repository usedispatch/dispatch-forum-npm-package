import { AddressImage } from '@cardinal/namespaces-components';
import { Connection, PublicKey } from '@solana/web3.js';

export interface IdentityIconProps {
  id: PublicKey;
  connection: Connection;
}

// TODO Ana: use this component instead of cardinal directly??
export const IdentityIcon = (props: IdentityIconProps): JSX.Element => {
  const { id, connection } = props;

  return (
    <div className='identityIconContainer'>
      <AddressImage
        address={id}
        connection={connection}
      />
    </div>
  );
};
