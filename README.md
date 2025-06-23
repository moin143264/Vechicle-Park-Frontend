# 🅿️ Smart Parking System – Frontend

This is the frontend application of the Smart Vehicle Parking System built using React.js and Bootstrap 5. The system allows users to check real-time parking slot availability, book slots, and view booking history. It’s fully responsive and integrates with a backend API built using Node.js and MongoDB.

🔗 **Live Demo**: https://vehicle-park.vercel.app  
💻 **GitHub Repo**: https://github.com/moin143264/Vechicle-Park-Frontend

---

## 🛠️ Technologies Used

- **React.js** – JavaScript framework for building UI  
- **Bootstrap 5** – For responsive, modern design  
- **React Router** – Navigation between pages  
- **Axios** – HTTP client for API integration  
- **Context API** – For global state management

---

## 📂 Key Features

✅ View available parking slots with status indicators  
✅ Book and cancel slots in real time  
✅ User authentication and session handling  
✅ Admin dashboard to manage slots and users *(if implemented)*  
✅ Fully responsive design for mobile and desktop  
✅ Seamless interaction with backend APIs  

---

## 🚀 Getting Started

Follow these steps to run the project locally:

```bash
# Clone the repository
git clone https://github.com/moin143264/Vechicle-Park-Frontend

# Navigate into the directory
cd Vechicle-Park-Frontend

# Install dependencies
npm install

# Start the app
npm start
src/
├── components/      # Header, SlotCard, etc.
├── pages/           # Home, Booking, Login, Register
├── context/         # Global user/session context
├── services/        # API logic (booking, slots, users)
├── assets/          # Images, logos
📌 Notes
Slot availability is fetched dynamically from the backend.

Authenticated users can book or release parking slots.

Admin-specific views can be added with role-based control.


