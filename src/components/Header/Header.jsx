
 import { Box ,Image } from '@mantine/core';
import passengerlogo from '../../assets/images/logo.png';

export default function Header(props) {
    return (
        <Box style={{ display:'flex',marginTop: 3 , justifyContent:'flex-end' }}  >
           <img src={passengerlogo}   className="appLogo" />
        </Box>
    );
  }

