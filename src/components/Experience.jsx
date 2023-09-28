import { Center } from '@react-three/drei';
import Monkey from './Monkey.jsx'

export const Experience = () => 
{
  return (
    <>
    <Center>
      <Monkey 
        rotation-y={ 180 * Math.PI / 180 }
        scale={ 1.5 }
      />
    </Center>
    </>
  );
};
