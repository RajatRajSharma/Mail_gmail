document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Submit handler
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id){
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#email-detail-view').style.display = 'block';

      document.querySelector('#email-detail-view').innerHTML =`
      <ul class="list-group">
        <li class="list-group-item"><strong>From:</strong> ${email.sender}</li>
        <li class="list-group-item"><strong>To:</strong> ${email.recipients}</li>
        <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
        <li class="list-group-item"><strong>Timestamp:</strong> ${email.timestamp}</li>
        <li class="list-group-item" rows="6"> ${email.body}</li>
      </ul>
      `

      // change to read
      if(!email.read){
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        });
      }

      // Archive / un-Archive logic
      const btn_arch = document.createElement('button');
      btn_arch.innerHTML = email.archived ? "Unarchive" : "Archive";
      btn_arch.className = email.archived ? "btn btn-info mx-2" : "btn btn-primary mx-2";
      btn_arch.addEventListener('click', function() {
          const action = email.archived ? "removed from" : "archived";
          const alertMessage = `Your email has been ${action} archive.`;
          
          fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: !email.archived
              })
          })
          .then(() => {
              showAlert(alertMessage, 1000); // 1000 milliseconds (1 second)
              load_mailbox('archive');
          });
      });
      document.querySelector('#email-detail-view').append(btn_arch);

      // Function to show an alert with a specified duration
      function showAlert(message, duration) {
          const alertDiv = document.createElement('div');
          alertDiv.className = 'alert alert-primary fixed-top'; 
          alertDiv.style.backgroundColor = '#0086ab';
          alertDiv.style.color = '#fff'; 
          alertDiv.innerText = message;
          document.querySelector('body').appendChild(alertDiv);

          setTimeout(() => {
              alertDiv.remove();
          }, duration);
      }

      // Reply logic
      const btn_reply = document.createElement('button');
      btn_reply.innerHTML = "Reply"
      btn_reply.className = "btn btn-success mx-2";
      btn_reply.addEventListener('click', function() {
        console.log("Reply");
        compose_email();

        document.querySelector('#compose-recipients').value = email.sender;
        // Check if the subject line already starts with "Re:"
        let subject = email.subject;
        if (!subject.startsWith("Re:")) {
          subject = "Re: " + email.subject;
        }
        document.querySelector('#compose-subject').value = subject;

        // Set the rows attribute to 6 for a 6-line textarea
        const composeBody = document.querySelector('#compose-body');
        composeBody.value = `On ${email.timestamp} , "${email.sender}" wrote : ${email.body} \n=>\n `;
        composeBody.rows = 6; // Set the number of rows to 6
      });

      document.querySelector('#email-detail-view').append(btn_reply);

      // Mark as Read/Unread logic
      const btn_unread = document.createElement('button');
      btn_unread.innerHTML = "Mark Unread";
      btn_unread.className = "btn btn-secondary mx-2";
      btn_unread.addEventListener('click', function () {
          // Call the mark as unread API endpoint
          fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  read: false,
              }),
          })
              .then(() => {
                  // Optionally, you can load the mailbox or perform any other action after marking as unread
                  load_mailbox('inbox');
              });
      });
      document.querySelector('#email-detail-view').append(btn_unread);

  });
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the email for that mailbox and user
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Loop through emails and create a table for each
      emails.forEach(email => {
        const newEmail = document.createElement('table');
        newEmail.className = 'email-table';
        
        // Create a row for the email
        const row = newEmail.insertRow();
        
        // Create cells for sender, subject, and timestamp
        const senderCell = row.insertCell();
        const subjectCell = row.insertCell();
        const timestampCell = row.insertCell();

        // Set the content of each cell
        senderCell.innerHTML = '<strong>' + email.sender + '</strong>';
        subjectCell.innerHTML = '<em>' + email.subject + '</em>';
        timestampCell.innerHTML = email.timestamp ;

        // Set column widths based on the specified ratios
        senderCell.style.width = '25%';
        subjectCell.style.width = '25%';
        timestampCell.style.width = '50%';

        // Set the table width to 100%
        newEmail.style.width = '100%';
        timestampCell.style.textAlign = 'right';

        // Change background color
        newEmail.className = email.read ? 'read' : 'unread';

        // Add click event to view email
        newEmail.addEventListener('click', function() {
            view_email(email.id);
        });

        const td = newEmail.querySelector('td');
        td.style.padding = '2px 10px';

        document.querySelector('#emails-view').append(newEmail);
        
        // Add a horizontal line to separate emails
        document.querySelector('#emails-view').appendChild(document.createElement('hr'));
      });
  });
}


function send_email(event){
  event.preventDefault();
  
  // Store fields
  const recipients = document.querySelector('#compose-recipients').value ;
  const subject = document.querySelector('#compose-subject').value ;
  const body = document.querySelector('#compose-body').value ;

  //send data to backend
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });
}
