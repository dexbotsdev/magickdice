import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { animated, useSpring } from '@react-spring/web';
import PropTypes from 'prop-types';
import BezierEasing from 'bezier-easing';
import { Howl } from 'howler';
import { wheelSections } from '../config';
import styles from '../assets/styles.scss';

import AnimatedWheelSVG from '../assets/AnimatedWheelSVG';
import ImgPickerArrow from '../assets/picker-arrow.png';
import ImgYouWin from '../../assets/images/you-win.png';

const cx = classNames.bind(styles);

const wheelSpinAudio = new Howl({ src: ['/assets/wheel/spin.mp3'] });
const winAudio = new Howl({ src: ['/assets/coinflip/win.mp3'] });
const loseAudio = new Howl({ src: ['/assets/coinflip/lose.mp3'] });

const springConfig = {
  duration: 3000,
};

const sectionOffset = 360 / wheelSections.length;

export default function Wheel({ spinTo, onSpinFinished, payoutRates }) {
  const [messageText, setMessageText] = useState('Place Your Bet');
  const [showResult, setShowResult] = useState(false);
  const [{ rotate }, spin] = useSpring({ rotate: 0, config: springConfig }, []);
  const [youWinProps, youWinAnimation] = useSpring({ transform: 'scale(0)', config: { tension: 350 } }, []);

  useEffect(() => {
    if (spinTo) {
      wheelSpinAudio.play();

      setMessageText('Spinning');

      const { result, isWin } = spinTo;

      // randomize rotations between 4 and 7
      const rotations = Math.floor(Math.random() * 4) + 4;
      let rotationOffset = 360 * rotations;

      let randomSectionIndex;
      do {
        randomSectionIndex = Math.floor(Math.random() * wheelSections.length);
      } while (wheelSections[randomSectionIndex] !== result.value);

      // random value between -sectionOffset / 2 and sectionOffset / 2
      // used to randomize where the arrow stops within the boundaries of a section
      const randomOffset = Math.floor(Math.random() * (sectionOffset - 5 + 1)) - (sectionOffset - 5) / 2;

      rotationOffset -= randomSectionIndex * sectionOffset + randomOffset;

      // rotate 90 degrees to face the arrow on the right
      rotationOffset += 90;

      // random value between 1.02 and 1.06
      const randomOvershot = (Math.floor(Math.random() * 5) + 102) / 100;

      spin
        .start({
          from: { rotate: 0 },
          to: { rotate: rotationOffset },
          config: { easing: new BezierEasing(0, 0.2, 0, randomOvershot) },
        })[0]
        .then(() => {
          setShowResult(true);
          setMessageText('Place Your Bet');

          if (isWin) {
            winAudio.play();

            // animate you win
            youWinAnimation.start({ transform: 'scale(1)', opacity: 1 })[0].then(() => {
              setTimeout(() => {
                youWinAnimation.start({ transform: 'scale(0)', opacity: 0 });
                setShowResult(false);
                onSpinFinished(spinTo);
              }, 800);
            });
          } else {
            loseAudio.play();

            setTimeout(() => {
              setShowResult(false);
              onSpinFinished(spinTo);
            }, 1400);
          }
        });
    }
  }, [spinTo]);

  return (
    <div className={cx('wheel-container')}>
      <animated.img style={youWinProps} className={cx('you-win')} src={ImgYouWin} alt="You win" />
      <div className={cx('overflow-container')}>
        <AnimatedWheelSVG style={{ rotate }} />
      </div>
      <div className={cx('center-content')}>
        {!showResult && (
          <div className={cx('message-box')}>
            <span className={cx('large')}>{messageText}</span>
          </div>
        )}
        {showResult && (
          <div className={cx('result-text', `color-${spinTo.result.value}`)}>
            {payoutRates[spinTo.result.value].toFixed(2)}x
          </div>
        )}
      </div>
      <img src={ImgPickerArrow} className={cx('picker-arrow')} alt="Picker Arrow" />
    </div>
  );
}
Wheel.propTypes = {
  spinTo: PropTypes.object,
  onSpinFinished: PropTypes.func.isRequired,
  payoutRates: PropTypes.object.isRequired,
};
Wheel.defaultProps = {
  spinTo: null,
};
