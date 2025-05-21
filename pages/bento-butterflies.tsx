import React from 'react';
import styles from '../styles/BentoButterflies.module.css';
import ThreeScene from '../components/ThreeScene'; // Import the component

const BentoButterfliesPage = () => {
  return (
    <div className={styles.mainContainer}>
      <div id="three-canvas-container" className={styles.canvasContainer}>
        <ThreeScene /> {/* Render the ThreeScene component here */}
      </div>
      <div className={styles.bentoGrid}>
        <div className={`${styles.bentoCard} ${styles.card1}`}>
          <h3>Welcome!</h3>
          <p>This is a sample card in our bento grid.</p>
        </div>
        <div className={`${styles.bentoCard} ${styles.card2}`}>
          {/* Placeholder for image or other content */}
          <p>Card 2: Item</p>
        </div>
        <div className={`${styles.bentoCard} ${styles.card3}`}>
          <p>Card 3: Details</p>
        </div>
        <div className={`${styles.bentoCard} ${styles.card4}`}>
          <p>Card 4: More Info</p>
        </div>
      </div>
    </div>
  );
};

export default BentoButterfliesPage;
