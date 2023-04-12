###### USER

checking---> POST /user/checking
profile----> GET /user/get/profile
login------> POST /user/login
register---> POST /user (require "hostID and id" in body)
update-----> PUT /user/${datas.id}/${host?.\_id}
delete-----> DELETE /user/${datas.id}/${host?.\_id}
getByID----> GET /user/${datas.id}/${host?.\_id}
getAll-----> GET /user/${datas.id}/${host?.\_id}
active License-----> POST /user/activation-license (require "hostID and id" in body)

###### ENCHERE
