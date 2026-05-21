import { motion }
from "framer-motion";

function MessageBubble({
  message,
  own
}) {

  const time =
    new Date().toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 20
      }}

      animate={{
        opacity: 1,
        y: 0
      }}

      transition={{
        duration: 0.2
      }}

      className={
        own
        ?
        "bubble own"
        :
        "bubble"
      }
    >

      <div>
        {message.message}
      </div>

      <small>
        {time}
      </small>

    </motion.div>
  );
}

export default MessageBubble;