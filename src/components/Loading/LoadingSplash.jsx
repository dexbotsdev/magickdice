import LogoImg from '../../assets/images/passengerlogo.png';
import { Center , Blockquote, Container } from '@mantine/core';


function LoadingSplash() {
  return (
       <Center style={{ margin: "auto", display:"flex" }}>
         <Container>
          <img src={LogoImg} alt="" style={{ marginTop: "250px" ,width: "250px" }} /> 

          <Blockquote cite="– Forrest Gump" >
            Life is like an npm install – you never know what you are going to get.
          </Blockquote>

          </Container>
      </Center > 
  );
}

export default LoadingSplash;
